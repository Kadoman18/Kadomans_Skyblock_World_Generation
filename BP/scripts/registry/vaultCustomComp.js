import { BlockCustomComponent, world, ItemStack, system } from "@minecraft/server";
import { playerInfoMaps } from "../cache/playersCache";
import { ticksToTime, debugMsg, coordsString } from "../utils/debugUtils";
import { randomNum } from "../utils/mathUtils";
import { makeVaultCooldownId, dispenseVaultLoot } from "../utils/customVaultUtils";

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
		for (const playerInfoMap of playerInfoMaps.values()) {
			const player = playerInfoMap.player;
			const cooldownId = makeVaultCooldownId(block, player);
			const cooldown = world.getDynamicProperty(cooldownId) ?? 0;
			if (cooldown > 0) {
				const next = Math.max(cooldown - 10, 0);
				world.setDynamicProperty(cooldownId, next);
				if (next % 600 === 0 || cooldown === 6000) {
					const time = ticksToTime(next);
					debugMsg(`${cooldownId}] Cooldown: ${time.minutes}m ${time.seconds}s`, false);
				}
				block.setPermutation(block.permutation.withState("kado:vault_state", "inactive"));
				continue;
			}
		}
		if (block.permutation.getState("kado:vault_state") === "dispensing") return;
		let hasEligiblePlayerNearby = false;
		for (const info of playerInfoMaps.values()) {
			const player = info.player;
			const xDist = player.location.x - blockCenter.x;
			const yDist = player.location.y - blockCenter.y;
			const zDist = player.location.z - blockCenter.z;
			const inRange = xDist ** 2 + yDist ** 2 + zDist ** 2 <= activationDist ** 2;
			if (!inRange) continue;
			const vaultKey = makeVaultCooldownId(block, info);
			const cooldown = world.getDynamicProperty(vaultKey) ?? 0;
			if (cooldown === 0) {
				hasEligiblePlayerNearby = true;
				break;
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
			block.setPermutation(block.permutation.withState("kado:vault_state", newState.state));
			dimension.playSound(newState.sound, block.location);
		}
	},
	onPlace(eventData) {
		const { block, previousBlock, dimension } = eventData;
		block.setPermutation(
			block.permutation
				.withState("kado:vault_type", "normal")
				.withState("kado:vault_state", "inactive"),
		);
	},
	onPlayerBreak(eventData) {
		const { block, brokenBlockPermutation } = eventData;
		const cooldownPrefix = `kado:reCusVault-${block.dimension.id}-${brokenBlockPermutation.getState("kado:vault_type")}-${coordsString(
			block.location,
			"id",
		)}-`;
		for (const cooldownId of world.getDynamicPropertyIds()) {
			if (cooldownId.startsWith(cooldownPrefix)) {
				world.setDynamicProperty(cooldownId, undefined);
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
			const oldType = vaultType;
			block.setPermutation(
				permutation.withState("kado:vault_type", oldType === "normal" ? "ominous" : "normal"),
			);
			const oldPrefix = `kado:reCusVault-${block.dimension.id}-${oldType}-${coordsString(
				block.location,
				"id",
			)}-`;
			for (const id of world.getDynamicPropertyIds()) {
				if (id.startsWith(oldPrefix)) {
					world.setDynamicProperty(id, undefined);
				}
			}
			return;
		}
		// Survival Interactions
		if (
			((world.getDynamicProperty(cooldownId) ?? 0) > 0 &&
				permutation.getState("kado:vault_state") !== "active") ||
			player.getGameMode() !== "Survival"
		) {
			dimension.playSound("vault.reject_rewarded_player", block.location);
			return;
		}
		const keyType = mainHand?.typeId;
		const valid =
			(keyType === "minecraft:trial_key" && vaultType === "normal") ||
			(keyType === "minecraft:ominous_trial_key" &&
				vaultType === "ominous" &&
				permutation.getState("kado:vault_state") === "active");
		if (!valid) {
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
		block.setPermutation(permutation.withState("kado:vault_state", "dispensing"));
		dispenseVaultLoot(dimension, block, lootRoll);
		system.runTimeout(
			() => {
				world.setDynamicProperty(cooldownId, 6000);
			},
			lootRoll.length * 20 + 15,
		);
	},
};
