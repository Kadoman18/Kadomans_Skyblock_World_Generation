import { world, BlockVolume, system, ItemStack } from "@minecraft/server";
import { calculateOffsets } from "../utils/mathUtils";
import { debugMsg, coordsString } from "../utils/debugUtils";
import {
	createTickingArea,
	waitForChunkLoaded,
	removeTickingArea,
	iterateBlockVolume,
} from "../utils/chunkUtils";
import { getIslands } from "../registry/islandDefs";

// --------------------------------------------------
// Island Build Functions
// --------------------------------------------------
/**
 * Applies block permutations efficiently.
 *
 * @param {object} iteration - Block definition with perms.
 * @param {BlockVolume} volume - Volume start.
 * @param {Dimension} dimension - Target dimension.
 */
function applyBlockPermutations(iteration, volume, dimension) {
	if (!iteration.perms) return;
	const permId = iteration.perms.perm;
	const permValue = iteration.perms.value;
	const { to, from } = volume;
	const singleBlock = from.x === to.x && from.y === to.y && from.z === to.z ? from : undefined;
	if (singleBlock) {
		const block = dimension.getBlock(singleBlock);
		if (!block) return;
		block.setPermutation(block.permutation.withState(permId, permValue));
		return;
	}
	iterateBlockVolume(dimension, volume, (block) => {
		block.setPermutation(block.permutation.withState(permId, permValue));
	});
}

/**
 * Builds all blocks of an island.
 *
 * @param {object} island - Island object.
 * @param {Vector3} worldOrigin - World origin reference.
 */
function buildIslandBlocks(island, worldOrigin) {
	const dimension = island.dimension;
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	debugMsg(
		`${island.name} origin resolved at ${coordsString(islandOrigin)}\nBuilding Island Now...`,
	);
	for (const iteration of island.blocks) {
		const dimension = world.getDimension(island.targetDimension);
		const from = calculateOffsets(islandOrigin, iteration.offset.from);
		const to = calculateOffsets(islandOrigin, iteration.offset.to);
		const volume = new BlockVolume(from, to);
		dimension.fillBlocks(volume, iteration.block);
		if (iteration.perms) {
			applyBlockPermutations(iteration, volume, dimension);
		}
	}
}

/**
 * Locates a chest on an island and fills it with loot.
 *
 * @param {object} island - Island object with loot.
 * @param {Vector3} worldOrigin - World origin reference.
 */
function fillChest(island, worldOrigin) {
	const dimension = world.getDimension(`minecraft:${island.targetDimension}`);
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	const containerLoc = calculateOffsets(islandOrigin, island.loot.containerLoc);
	system.run(() => {
		const container = dimension.getBlock(containerLoc);
		if (container?.typeId !== "minecraft:chest") {
			debugMsg(
				`${island.name} Loot Chest not found at location: ${coordsString(containerLoc)}`,
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
			`${island.name} Loot Chest found and filled at location: ${coordsString(containerLoc)}`,
		);
	});
}

/**
 * Fills chest with loot if defined.
 *
 * @param {object} island - Island object with loot.
 * @param {Vector3} worldOrigin - World origin reference.
 */
function finalizeIslandLoot(island, worldOrigin) {
	if (!island.loot) return;
	fillChest(island, worldOrigin);
}
/**
 * Temporarily prevents player movement by repeatedly teleporting them.
 * Used during island generation to avoid falling before terrain exists.
 *
 * @param {Player} player - Player to suspend.
 * @param {Vector3} location - Fixed teleport location.
 * @param {number} ticks - Duration in ticks.
 */

export function suspendPlayer(player, location, ticks = 40) {
	const suspend = system.runInterval(() => {
		player.tryTeleport(location);
		debugMsg(`${player.name} Suspended.`);
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
 * @param {object} island - Island definition.
 * @param {Vector3} worldOrigin - World origin reference.
 */

export function generateIsland(island, worldOrigin) {
	const dimension = world.getDimension(`minecraft:${island.targetDimension}`);
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

export function makeUnlockKey(dimension) {
	return `kado:${dimension.id.replaceAll("minecraft:", "")}_unlocked`;
}

/**
 * Initializes island generation for a player’s current dimension.
 *
 * @param {Player} player
 * @returns {boolean}
 */
export function initializeIslands(player) {
	const { dimension, location } = player;
	const unlockKey = makeUnlockKey(player.dimension);
	if (world.getDynamicProperty(unlockKey)) return true;
	const islands = getIslands(player.dimension);
	if (!islands || islands.length === 0) return false;
	const origin =
		dimension.id === "minecraft:overworld"
			? {
					x: world.getDefaultSpawnLocation().x,
					y: 65,
					z: world.getDefaultSpawnLocation().z,
				}
			: location;
	debugMsg(`Origin Found: ${coordsString(origin)} - Awaiting island generation.`);
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
