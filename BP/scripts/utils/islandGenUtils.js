import { world, BlockVolume, system, ItemStack } from "@minecraft/server";
import { calculateOffsets } from "../utils/mathUtils";
import { debugMsg, coordsString } from "../utils/debugUtils";
import { createTickingArea, waitForChunkLoaded, removeTickingArea } from "../utils/chunkUtils";

// --------------------------------------------------
// Island Build Functions
// --------------------------------------------------
/**
 * Resolves the dimension object for an island.
 *
 * @param {object} island - Island object with targetDimension.
 * @returns {boolean} True if successful, false if failed.
 */
function prepareIsland(island) {
	try {
		island.dimension = world.getDimension(island.targetDimension);
		return true;
	} catch (error) {
		debugMsg(`Failed to resolve dimension for island: ${island.name}`, true);
		return false;
	}
}
/**
 * Applies block permutations efficiently.
 *
 * @param {object} iteration - Block definition with perms.
 * @param {Vector3} from - Volume start.
 * @param {Vector3} to - Volume end.
 * @param {Dimension} dimension - Target dimension.
 */
function applyBlockPermutations(iteration, from, to, dimension) {
	const permId = iteration.perms.perm;
	const permValue = iteration.perms.value;
	// Single-block optimization avoids unnecessary triple loops and prevents edge cases with unloaded neighbors
	const singleBlock = from.x === to.x && from.y === to.y && from.z === to.z ? from : undefined;
	if (singleBlock) {
		const block = dimension.getBlock(singleBlock);
		if (!block) return;
		block.setPermutation(block.permutation.withState(permId, permValue));
		debugMsg(`Set permutation ${permId}=${permValue} at ${coordsString(from)}`, false);
		return;
	}
	for (let x = from.x; x <= to.x; x++) {
		for (let y = from.y; y <= to.y; y++) {
			for (let z = from.z; z <= to.z; z++) {
				const block = dimension.getBlock({ x, y, z });
				if (!block) continue;
				block.setPermutation(block.permutation.withState(permId, permValue));
			}
		}
	}
	debugMsg(
		`Set permutation ${permId}=${permValue} for volume ${coordsString(from)} -> ${coordsString(
			to,
		)}`,
	);
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
	for (const key in island.blocks) {
		const iteration = island.blocks[key];
		const from = calculateOffsets(islandOrigin, iteration.offset.from);
		const to = calculateOffsets(islandOrigin, iteration.offset.to);
		debugMsg(`Building "${key}" from ${coordsString(from)} to ${coordsString(to)}`, false);
		const volume = new BlockVolume(from, to);
		dimension.fillBlocks(volume, iteration.block);
		if (iteration.perms) applyBlockPermutations(iteration, from, to, dimension);
	}
}
/**
 * Locates a chest on an island and fills it with loot.
 *
 * @param {object} island - Island object with loot.
 * @param {Vector3} worldOrigin - World origin reference.
 */
function fillChest(island, worldOrigin) {
	const dimension = island.dimension;
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	const chestLoc = calculateOffsets(islandOrigin, island.loot.chestLoc);
	const chestBlock = dimension.getBlock(chestLoc);
	if (chestBlock?.typeId === "minecraft:chest") {
		const chestEntity = chestBlock.getComponent("minecraft:inventory");
		if (!chestEntity) return;
		const lootTable = island.loot.items;
		system.run(() => {
			for (let loot in lootTable) {
				const iteration = lootTable[loot];
				chestEntity.container.setItem(
					iteration.slot,
					new ItemStack(iteration.item, iteration.amount),
				);
			}
		});
		debugMsg(`${island.name} Loot Chest found and filled at location: ${coordsString(chestLoc)}`);
	} else {
		debugMsg(`${island.name} Loot Chest not found at location: ${coordsString(chestLoc)}`, true);
	}
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
	if (!prepareIsland(island)) return;
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	const tickName = `${island.name.replace(/\s+/g, "_").toLowerCase()}`;
	createTickingArea(island.dimension, islandOrigin, tickName);
	system.run(async () => {
		await waitForChunkLoaded(island.dimension, islandOrigin);
		buildIslandBlocks(island, worldOrigin);
		finalizeIslandLoot(island, worldOrigin);
		debugMsg(`${island.name} generation complete.`);
		system.runTimeout(() => {
			removeTickingArea(island.dimension, tickName);
		}, 20);
	});
}
