import { system, world } from "@minecraft/server";
import { randomNum } from "../utils/mathUtils";
import { coordsString, debugMsg } from "../utils/debugUtils";
import { applyPermsToBlock } from "./chunkUtils";

// --------------------------------------------------
// Reusable Custom Vaults Functions
// --------------------------------------------------
/**
 * Generates a unique cooldown identifier for a vault-player pair.
 * * Cooldowns are scoped by:
 * - Dimension
 * - Vault type
 * - Vault block location
 * - Player identifier
 * * This allows:
 * - Multiple players to use the same vault independently
 * - One player to interact with multiple vaults concurrently
 *
 * @param {import("@minecraft/server").Block} block - Vault block.
 * @param {import("@minecraft/server").Player} player - Player interacting with the vault.
 * @returns {string} Dynamic property key.
 */
export function makeVaultCooldownId(block, player) {
	return `kado:vault-${block.permutation.getState("kado:vault_type")}-${coordsString(block.location, "id")}-${player.name}`;
}

/**
 * Sequentially ejects generated vault loot items.
 * * Behavior:
 * - Opens the vault shutter
 * - Dispenses one item per second
 * - Applies controlled impulse for visual ejection
 * - Returns vault to ACTIVE state after completion
 *
 * @param {import("@minecraft/server").Dimension} dimension - Vault Block dimension.
 * @param {import("@minecraft/server").Block} block - Vault block.
 * @param {Array<ItemStack>} lootRoll - Generated loot entries.
 */
export function dispenseVaultLoot(dimension, block, lootRoll) {
	dimension.playSound("vault.open_shutter", block.location);
	system.runTimeout(() => {
		let iter = 0;
		const ejecting = system.runInterval(() => {
			if (iter < lootRoll.length) {
				const itemEntity = dimension.spawnItem(lootRoll[iter], {
					x: block.location.x + 0.5,
					y: block.location.y + 1,
					z: block.location.z + 0.5,
				});
				itemEntity.clearVelocity();
				itemEntity.applyImpulse({
					x: randomNum(-0.033, 0.033, false),
					y: 0.25,
					z: randomNum(-0.025, 0.025, false),
				});
				dimension.playSound("vault.eject_item", block.location, {
					pitch: 0.8 + iter * 0.1,
				});
				iter++;
				return;
			}
			system.clearRun(ejecting);
			applyPermsToBlock(block, [{ id: "kado:vault_state", value: "inactive" }]);
			dimension.playSound("vault.deactivate", block.location);
		}, 20);
	}, 10);
}

/**
 * Extracts block coordinates from a dynamic property identifier.
 * * Expected coordinate format inside the id:
 *   (X:Y:Z)
 * * Example:
 *   kado:budAmWater-minecraft:overworld-(1:64:2)
 *
 * @param {string} id - Dynamic property identifier.
 * @returns {import("@minecraft/server").Vector3} Parsed coordinates or undefined if invalid.

*/
export function parseCoordsFromId(id) {
	const match = id.match(/\((-?\d+):(-?\d+):(-?\d+)\)/);
	if (!match) return undefined;
	return {
		x: Number(match[1]),
		y: Number(match[2]),
		z: Number(match[3]),
	};
}

/**
 * Checks interactions for invalid cases to reject.
 *
 * @param {string} cooldownId - Vault specific cooldown dynamic property id.
 * @param {import("@minecraft/server").BlockPermutation} permutation - Permutation of this vault block.
 * @param {import("@minecraft/server").Player} player - Player interacting with the vault.
 * @returns {boolean}
 */
export function invalidVaultInteract(cooldownId, permutation, player) {
	return (
		((world.getDynamicProperty(cooldownId) ?? 0) > 0 &&
			permutation.getState("kado:vault_state") !== "active") ||
		player.getGameMode() !== "Survival"
	);
}

// ^lies
/**
 * Toggles the vault type when the player is in creative.
 *
 * @param {string} vaultType - Type of vault being interacted with.
 * @param {import("@minecraft/server").Block} block - The vault block.
 */
export function toggleVaultType(vaultType, block) {
	const oldType = vaultType;
	applyPermsToBlock(block, [
		{ id: "kado:vault_type", value: oldType === "normal" ? "ominous" : "normal" },
	]);
	const oldPrefix = `kado:vault-${oldType}-${coordsString(block.location, "id")}-`;
	for (const id of world.getDynamicPropertyIds()) {
		if (id.startsWith(oldPrefix)) {
			world.setDynamicProperty(id, undefined);
			debugMsg(`Dynamic Property with prefix ${oldPrefix} removed.`);
		}
	}
}

/**
 * Checks to see if the player has correctly interracted with a vault block.
 *
 * @param {string} mainhand - Item id of the itemstack in the mainhand of the player.
 * @param {string} vaultType - Type of vault being interacted with.
 * @param {import("@minecraft/server").BlockPermutation} permutation - Permutation of this vault block.
 * @returns {boolean}
 */
export function validVaultInteract(mainhand, vaultType, permutation) {
	return (
		(mainhand === "minecraft:trial_key" && vaultType === "normal") ||
		(mainhand === "minecraft:ominous_trial_key" &&
			vaultType === "ominous" &&
			permutation.getState("kado:vault_state") === "active")
	);
}
