import { world, BlockVolume, system, ItemStack } from "@minecraft/server";
import { calculateOffsets } from "../utils/mathUtils";
import { typeIdify, debugMsg, coordsString } from "../utils/debugUtils";
import {
	applyPermsToLocation,
	createTickingArea,
	removeTickingArea,
	waitForChunkLoaded,
} from "../utils/chunkUtils";
import { getIslands } from "../registry/islandDefs";

/**
 * Builds all blocks of an island.
 *
 * @param {import("../utils/typedefs").IslandDef} island - Island object.
 * @param {import("@minecraft/server").Vector3} worldOrigin - World origin reference.
 */
function buildIslandBlocks(island, worldOrigin) {
	const dimension = world.getDimension(island.dimension);
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	debugMsg(`Building ${island.name} Now...`);
	for (const iteration of island.blocks) {
		const from = calculateOffsets(islandOrigin, iteration.offset.from);
		const to = calculateOffsets(islandOrigin, iteration.offset.to);
		const volume = new BlockVolume(from, to);
		dimension.fillBlocks(volume, iteration.blockId);
		if (iteration.perms) {
			applyPermsToLocation(dimension, volume, iteration.perms);
		}
	}
}

const containersArray = [
	"minecraft:barrel",
	"minecraft:black_shulker_box",
	"minecraft:blast_furnace",
	"minecraft:blue_shulker_box",
	"minecraft:brewing_stand",
	"minecraft:brown_shulker_box",
	"minecraft:copper_chest",
	"minecraft:cyan_shulker_box",
	"minecraft:decorated_pot",
	"minecraft:dispenser",
	"minecraft:dropper",
	"minecraft:exposed_copper_chest",
	"minecraft:furnace",
	"minecraft:gray_shulker_box",
	"minecraft:green_shulker_box",
	"minecraft:hopper",
	"minecraft:light_blue_shulker_box",
	"minecraft:light_gray_shulker_box",
	"minecraft:lime_shulker_box",
	"minecraft:magenta_shulker_box",
	"minecraft:orange_shulker_box",
	"minecraft:oxidized_copper_chest",
	"minecraft:pink_shulker_box",
	"minecraft:purple_shulker_box",
	"minecraft:red_shulker_box",
	"minecraft:smoker",
	"minecraft:trapped_chest",
	"minecraft:undyed_shulker_box",
	"minecraft:waxed_copper_chest",
	"minecraft:waxed_exposed_copper_chest",
	"minecraft:waxed_oxidized_copper_chest",
	"minecraft:waxed_weathered_copper_chest",
	"minecraft:weathered_copper_chest",
	"minecraft:white_shulker_box",
	"minecraft:yellow_shulker_box",
	"minecraft:chest",
	"minecraft:crafter",
];

/**
 * Locates a chest on an island and fills it with loot.
 *
 * @param {import("../utils/typedefs").IslandDef} island - Island object with loot.
 * @param {import("@minecraft/server").Vector3} worldOrigin - World origin reference.
 */
function fillContainer(island, worldOrigin) {
	const dimension = world.getDimension(`minecraft:${island.dimension}`);
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	const containerLoc = calculateOffsets(islandOrigin, island.loot.containerLoc);
	system.run(() => {
		const container = dimension.getBlock(containerLoc);
		if (!containersArray.includes(container?.typeId)) {
			debugMsg(
				`${island.name} Loot container not found at location: ${coordsString(containerLoc)}`,
				true,
			);
			return;
		}
		const inventory = container.getComponent("minecraft:inventory");
		if (!inventory) return;
		for (const iteration of island.loot.items) {
			inventory.container.setItem(
				iteration.slot,
				new ItemStack(iteration.item, iteration.amount),
			);
		}
		debugMsg(
			`${island.name} Loot container of type ${typeIdify(container.typeId)} found and filled at location: ${coordsString(containerLoc)}`,
		);
	});
}

/**
 * Fills chest with loot if defined.
 *
 * @param {import("../utils/typedefs").IslandDef} island - Island object with loot.
 * @param {import("@minecraft/server").Vector3} worldOrigin - World origin reference.
 */
function finalizeIslandLoot(island, worldOrigin) {
	if (!island.loot) return;
	fillContainer(island, worldOrigin);
}

/**
 * Temporarily prevents player movement by repeatedly teleporting them.
 * Used during island generation to avoid falling before terrain exists.
 *
 * @param {import("@minecraft/server").Player} player - Player to suspend.
 * @param {import("@minecraft/server").Vector3} location - Fixed teleport location.
 * @param {number} ticks - Duration in ticks.
 */
export function suspendPlayer(player, location, ticks = 40) {
	const suspend = system.runInterval(() => {
		player.tryTeleport(location);
	}, 5);
	system.runTimeout(() => {
		system.clearRun(suspend);
	}, ticks);
}

/**
 * Fully generates an island instance.
 * * Steps:
 * - Resolves target dimension
 * - Creates a temporary ticking area
 * - Builds island blocks
 * - Populates loot chests
 * - Cleans up ticking area
 *
 * @param {import("../utils/typedefs").IslandDef} island - Island definition.
 * @param {import("@minecraft/server").Vector3} worldOrigin - World origin reference.
 */
export function generateIsland(island, worldOrigin) {
	const dimension = world.getDimension(`minecraft:${island.dimension}`);
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	const tickName = `${island.name.replace(/\s+/g, "_").toLowerCase()}`;
	createTickingArea(dimension, islandOrigin, tickName);
	system.run(async () => {
		await waitForChunkLoaded(dimension, islandOrigin);
		buildIslandBlocks(island, worldOrigin);
		finalizeIslandLoot(island, worldOrigin);
		debugMsg(`${island.name} generation complete.`);
		system.runTimeout(() => {
			removeTickingArea(dimension, tickName);
		}, 20);
	});
}

/**
 *
 * @param {import("@minecraft/server").Dimension} dimension - The dimension to unlock.
 * @returns {string} The unlock key for the dynamic property id.
 */
export function makeUnlockKey(dimension) {
	return `kado:${dimension.id.replaceAll("minecraft:", "")}_unlocked`;
}

/**
 * Initializes island generation for a player’s current dimension.
 *
 * @param {import("@minecraft/server").Player} player - The player triggering the island initialization.
 * @returns {boolean} `true` if island generation succeeds, `false` otherwise.
 */
export function initializeIslands(player) {
	const { dimension, location } = player;
	const unlockKey = makeUnlockKey(player.dimension);
	if (world.getDynamicProperty(unlockKey)) return true;
	const islands = getIslands(player.dimension);
	if (!islands || islands.length === 0) return false;
	const origin = getIslandOrigin(dimension, location);
	debugMsg(`Origin Found: ${coordsString(origin)} - Awaiting Generation...`);
	suspendPlayer(
		player,
		{
			x: origin.x + 0.5,
			y: origin.y,
			z: origin.z + 0.5,
		},
		10,
	);
	// Thanks Lyvvy <3
	for (const island of islands) {
		generateIsland(island, origin);
	}
	world.setDynamicProperty(unlockKey, true);
	debugMsg(`Dynamic Property "${unlockKey}" set to ${world.getDynamicProperty(unlockKey)}`);
	return true;
}

/**
 *
 * @param {import("@minecraft/server").Dimension} dimension - Dimension to get the origin point of.
 * @param {import("@minecraft/server").Vector3} location - Player location object for island reference.
 * @returns {import("@minecraft/server").Vector3} The world origin.
 */
function getIslandOrigin(dimension, location) {
	switch (dimension.id) {
		case "minecraft:overworld":
			return {
				x: world.getDefaultSpawnLocation().x,
				y: 65,
				z: world.getDefaultSpawnLocation().z,
			};
		default: {
			return location;
		}
	}
}
