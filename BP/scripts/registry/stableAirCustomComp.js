import { playerInfoMaps } from "../cache/playersCache";
import { applyPermsToBlock } from "../utils/chunkUtils";

/**
 * Determines the avoidance corner farthest from the player.
 *
 * @param {import("@minecraft/server").Block} block
 * @param {import("@minecraft/server").Player} player
 * @returns {"nw"|"ne"|"sw"|"se"}
 */
function getAvoidanceCorner(block, player) {
	const blockCenter = { x: block.location.x + 0.5, z: block.location.z + 0.5 };
	const distance = { x: player.location.x - blockCenter.x, z: player.location.z - blockCenter.z };
	const playerIsEast = distance.x > 0;
	const playerIsSouth = distance.z > 0;
	// Invert direction to get farthest corner
	if (playerIsSouth && playerIsEast) return "nw";
	if (!playerIsSouth && playerIsEast) return "sw";
	if (playerIsSouth && !playerIsEast) return "ne";
	if (!playerIsSouth && !playerIsEast) return "se";
}

const gravityBlocks = [
	"minecraft:anvil",
	"minecraft:black_concrete_powder",
	"minecraft:blue_concrete_powder",
	"minecraft:brown_concrete_powder",
	"minecraft:chipped_anvil",
	"minecraft:cyan_concrete_powder",
	"minecraft:damaged_anvil",
	"minecraft:dragon_egg",
	"minecraft:gravel",
	"minecraft:gray_concrete_powder",
	"minecraft:green_concrete_powder",
	"minecraft:light_blue_concrete_powder",
	"minecraft:light_gray_concrete_powder",
	"minecraft:magenta_concrete_powder",
	"minecraft:orange_concrete_powder",
	"minecraft:pink_concrete_powder",
	"minecraft:pointed_dripstone",
	"minecraft:purple_concrete_powder",
	"minecraft:red_concrete_powder",
	"minecraft:red_sand",
	"minecraft:sand",
	"minecraft:scaffolding",
	"minecraft:suspicious_gravel",
	"minecraft:suspicious_sand",
	"minecraft:white_concrete_powder",
	"minecraft:yellow_concrete_powder",
	"minecraft:lime_concrete_powder",
	"minecraft:pointed_dripstone",
];

/** @type {import("@minecraft/server").BlockCustomComponent} */
export const kadoStableAir = {
	onTick(eventData) {
		const { block, dimension } = eventData;
		let shouldBeVisible = false;
		let closestPlayer = undefined;
		let closestDistanceSq = Infinity;
		if (!dimension.isChunkLoaded(block.location)) return;
		for (const playerInfoMap of playerInfoMaps.values()) {
			const player = playerInfoMap.player;
			const mainHandItem = player
				.getComponent("minecraft:inventory")
				.container.getItem(player.selectedSlotIndex);
			const offHandItem = player.getComponent("minecraft:equippable").getEquipment("Offhand");
			if (
				player.getGameMode() === "Creative" &&
				(mainHandItem?.typeId === "kado:stable_air" ||
					offHandItem?.typeId === "kado:stable_air")
			) {
				shouldBeVisible = true;
			}
			const playerDist = {
				x: player.location.x - (block.location.x + 0.5),
				z: player.location.z - (block.location.z + 0.5),
			};
			const distSq = playerDist.x ** 2 + playerDist.z ** 2;
			if (distSq < closestDistanceSq) {
				closestDistanceSq = distSq;
				closestPlayer = player;
			}
		}
		const currentVisibility = block.permutation.getState("kado:visibe");
		if (currentVisibility !== shouldBeVisible) {
			applyPermsToBlock(block, [{ id: "kado:visibe", value: shouldBeVisible }]);
		}
		// Only update avoidance when invisible, purpose is support, and a player exists
		if (!shouldBeVisible && closestPlayer) {
			const targetAvoidance = getAvoidanceCorner(block, closestPlayer);
			const currentAvoidance = block.permutation.getState("kado:avoidance");

			if (currentAvoidance !== targetAvoidance) {
				applyPermsToBlock(block, [{ id: "kado:avoidance", value: targetAvoidance }]);
			}
		}
		if (
			gravityBlocks.includes(block.above().typeId) ||
			gravityBlocks.includes(block.below().typeId)
		) {
			applyPermsToBlock(block, [{ id: "kado:active", value: true }]);
		}
		if (
			!gravityBlocks.includes(block.above().typeId) &&
			!gravityBlocks.includes(block.below().typeId) &&
			block.permutation.getState("kado:active") === true
		) {
			dimension.setBlockType(block.location, "minecraft:air");
		}
	},
	onPlace(eventData) {
		const { block, dimension } = eventData;
		applyPermsToBlock(block, [
			{ id: "kado:visibe", value: true },
			{ id: "kado:active", value: false },
		]);
	},
};
