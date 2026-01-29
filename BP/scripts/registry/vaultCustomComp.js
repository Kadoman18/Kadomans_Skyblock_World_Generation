import { BlockCustomComponent, world, ItemStack, system } from "@minecraft/server";
import { playerInfoMaps } from "../cache/playersCache";
import { ticksToTime, debugMsg, coordsString } from "../utils/debugUtils";
import { randomNum } from "../utils/mathUtils";
import {
	makeVaultCooldownId,
	dispenseVaultLoot,
	invalidVaultInteract,
	toggleVaultType,
	validVaultInteract,
} from "../utils/customVaultUtils";
import { applyPermsToBlock } from "../utils/chunkUtils";

/** @type {BlockCustomComponent} */
export const kadoVault = {
	onTick(eventData) {
		const { block, dimension } = eventData;
		const activationDist = 3.5;
		const blockCenter = {
			x: block.location.x + 0.5,
			y: block.location.y + 0.5,
			z: block.location.z + 0.5,
		};
		const particleLoc = {
			x: block.location.x + randomNum(0.1, 0.9, false),
			y: block.location.y + randomNum(0.1, 0.9, false),
			z: block.location.z + randomNum(0.1, 0.9, false),
		};
		dimension.spawnParticle("minecraft:basic_smoke_particle", particleLoc);
		// World-level, per player cooldown ticking
		let anyCooldownActive = false;
		for (const playerInfoMap of playerInfoMaps.values()) {
			const player = playerInfoMap.player;
			const cooldownId = makeVaultCooldownId(block, player);
			const cooldown = world.getDynamicProperty(cooldownId) ?? 0;

			if (cooldown > 0) {
				const next = Math.max(cooldown - 10, 0);
				world.setDynamicProperty(cooldownId, next);
				anyCooldownActive = true;

				if (next % 600 === 0 || cooldown === 6000) {
					const time = ticksToTime(next);
					debugMsg(`${cooldownId}] Cooldown: ${time.minutes}m ${time.seconds}s`, false);
				}
			}
		}
		if (block.permutation.getState("kado:vault_state") === "dispensing") return;
		let hasEligiblePlayerNearby = false;
		if (!anyCooldownActive) {
			for (const info of playerInfoMaps.values()) {
				const player = info.player;
				const xDist = player.location.x - blockCenter.x;
				const yDist = player.location.y - blockCenter.y;
				const zDist = player.location.z - blockCenter.z;
				const inRange = xDist ** 2 + yDist ** 2 + zDist ** 2 <= activationDist ** 2;
				if (!inRange) continue;
				const vaultKey = makeVaultCooldownId(block, player);
				const cooldown = world.getDynamicProperty(vaultKey) ?? 0;
				if (cooldown === 0) {
					hasEligiblePlayerNearby = true;
					break;
				}
			}
		}
		const newState = hasEligiblePlayerNearby
			? { state: "active", sound: "vault.activate" }
			: { state: "inactive", sound: "vault.deactivate" };
		const particle =
			block.permutation.getState("kado:vault_type") === "normal"
				? "minecraft:basic_flame_particle"
				: "minecraft:blue_flame_particle";
		if (
			block.permutation.getState("kado:vault_state") === "active" ||
			block.permutation.getState("kado:vault_state") === "dispensing"
		) {
			dimension.spawnParticle(particle, particleLoc);
		}
		if (block.permutation.getState("kado:vault_state") !== newState.state) {
			applyPermsToBlock(block, [{ id: "kado:vault_state", value: newState.state }]);
			dimension.playSound(newState.sound, block.location);
		}
	},
	onPlace(eventData) {
		const { block, previousBlock, dimension } = eventData;
		applyPermsToBlock(block, [
			{ id: "kado:vault_type", value: "normal" },
			{ id: "kado:vault_state", value: "inactive" },
		]);
	},
	onPlayerBreak(eventData) {
		const { block, brokenBlockPermutation } = eventData;
		const cooldownPrefix = `kado:vault-${brokenBlockPermutation.getState("kado:vault_type")}-${coordsString(block.location, "id")}-`;
		debugMsg(`Block at ${coordsString(block.location)} broken!`);
		for (const cooldownId of world.getDynamicPropertyIds()) {
			if (cooldownId.startsWith(cooldownPrefix)) {
				world.setDynamicProperty(cooldownId, undefined);
				debugMsg(`Cooldown property for vault at ${coordsString(block.location)} removed.`);
			}
		}
	},
	onPlayerInteract(eventData) {
		const { dimension, player, block, face, faceLocation } = eventData;
		const inventory = player.getComponent("minecraft:inventory");
		const mainHand = inventory.container?.getItem(player.selectedSlotIndex);
		const permutation = block.permutation;
		const vaultType = permutation.getState("kado:vault_type");
		const cooldownId = makeVaultCooldownId(block, player);
		// Creative Vault Type Toggle
		if (player.getGameMode() === "Creative" && (!mainHand || mainHand.typeId === "kado:vault")) {
			toggleVaultType(vaultType, block);
			return;
		}
		// Survival Interactions
		if (invalidVaultInteract(cooldownId, permutation, player)) {
			dimension.playSound("vault.reject_rewarded_player", block.location);
			return;
		}
		const keyType = mainHand?.typeId;
		if (!validVaultInteract(keyType, vaultType, permutation)) {
			dimension.playSound("vault.reject_rewarded_player", block.location);
			return;
		}
		if (mainHand.amount > 1) {
			inventory.container.setItem(
				player.selectedSlotIndex,
				new ItemStack(keyType, mainHand.amount - 1),
			);
		} else {
			inventory.container.setItem(player.selectedSlotIndex, undefined);
		}
		dimension.playSound("vault.insert_item", block.location);
		const lootManager = world.getLootTableManager();
		const lootTable =
			vaultType === "normal"
				? lootManager.getLootTable("chests/trial_chambers/reward")
				: lootManager.getLootTable("chests/trial_chambers/reward_ominous");
		const lootRoll = lootManager.generateLootFromTable(lootTable);
		applyPermsToBlock(block, [{ id: "kado:vault_state", value: "dispensing" }]);
		dispenseVaultLoot(dimension, block, lootRoll);
		system.runTimeout(
			() => {
				world.setDynamicProperty(cooldownId, 6000);
			},
			lootRoll.length * 20 + 15,
		);
	},
};
