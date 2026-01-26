import {
	world,
	Dimension,
	BlockVolume,
	Player,
	Vector3,
	Container,
	system,
	ItemStack,
} from "@minecraft/server";
import { calculateOffsets } from "../utils/mathUtils";
import { debugMsg, coordsString } from "../utils/debugUtils";
import {
	applyPermToLocation,
	createTickingArea,
	removeTickingArea,
	waitForChunkLoaded,
} from "../utils/chunkUtils";

/**
 * Builds all block volumes for an island.
 *
 * @param {import("../utils/typedefs").IslandDef} island - Island definition.
 * @param {Vector3} worldOrigin - World origin reference.
 */
function iterateIslandBuild(island, worldOrigin) {
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	debugMsg(
		`${island.name} origin resolved at ${coordsString(islandOrigin)}\nBuilding Island Now...`,
	);
	for (const volume of island.blocks) {
		const from = calculateOffsets(islandOrigin, volume.offset.from);
		const to = calculateOffsets(islandOrigin, volume.offset.to);
		const blockVol = new BlockVolume(from, to);
		debugMsg(
			`Building "${volume.blockId}" from ${coordsString(blockVol.from)} to ${coordsString(blockVol.to)}`,
			false,
		);
		island.dimension.fillBlocks(blockVol, volume.blockId);
		if (!volume.perms) continue;
		applyPermToLocation(island.dimension, blockVol, volume.perms.perm, volume.perms.value);
	}
}

/**
 * Locates a loot container on an island and fills it.
 *
 * @param {import("../utils/typedefs").IslandDef} island - Island definition with loot.
 * @param {Vector3} worldOrigin - World origin reference.
 */
function populateLootContainer(island, worldOrigin) {
	if (!island.loot) return;
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	const containerLoc = calculateOffsets(islandOrigin, island.loot.containerLoc);
	const containerBlock = island.dimension.getBlock(containerLoc);
	if (!containerBlock) {
		debugMsg(`${island.name} loot container not found at ${coordsString(containerLoc)}`, true);
		return;
	}
	const inventory = containerBlock.getComponent("minecraft:inventory");
	if (!inventory) return;
	system.run(() => {
		for (const loot of island.loot.items) {
			fillContainer(inventory, loot);
		}
	});
	debugMsg(`${island.name} loot container populated at ${coordsString(containerLoc)}`);
}

/**
 * Inserts an item stack into a container slot.
 *
 * @param {Container} container - Container inventory.
 * @param {import("../utils/typedefs").Loot} loot - Loot entry.
 */
function fillContainer(container, loot) {
	container.setItem(loot.slot, new ItemStack(loot.item, loot.amount));
}

/**
 * Populates island loot if defined.
 *
 * @param {import("../utils/typedefs").IslandDef} island - Island definition.
 * @param {Vector3} worldOrigin - World origin reference.
 */
function finalizeIslandLoot(island, worldOrigin) {
	if (!island.loot) return;
	populateLootContainer(island, worldOrigin);
}

/**
 * Temporarily prevents player movement by repeatedly teleporting them.
 * Used during island generation to avoid falling before terrain exists.
 *
 * @param {Player} player - Player to suspend.
 * @param {Vector3} location - Fixed teleport location.
 * @param {number} ticks - Duration in ticks.
 */
function suspendPlayer(player, location, ticks = 40) {
	const suspend = system.runInterval(() => {
		player.tryTeleport(location);
	}, 5);
	system.runTimeout(() => {
		system.clearRun(suspend);
	}, ticks);
}

/**
 * Fully generates an island instance.
 *
 * Steps:
 * - Creates a temporary ticking area
 * - Waits for chunk load
 * - Builds island blocks
 * - Populates loot containers
 * - Removes ticking area
 *
 * @param {import("../utils/typedefs").IslandDef} island - Island definition.
 * @param {Vector3} worldOrigin - World origin reference.
 */
export function generateIsland(island, worldOrigin) {
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	const tickName = island.name.replace(/\s+/g, "_").toLowerCase();
	createTickingArea(island.dimension, islandOrigin, tickName);
	system.run(async () => {
		await waitForChunkLoaded(island.dimension, islandOrigin);
		debugMsg(JSON.stringify(island, null, 2), true);
		iterateIslandBuild(island, worldOrigin);
		finalizeIslandLoot(island, worldOrigin);
		debugMsg(`${island.name} generation complete.`);
		system.runTimeout(() => {
			removeTickingArea(island.dimension, tickName);
		}, 20);
	});
}

/**
 * Initializes island generation for a dimension.
 *
 * @param {Object} options
 * @param {Dimension} options.dimension
 * @param {string} options.unlockProperty
 * @param {import("./typedefs").IslandDef[]} options.islands
 * @param {(Player) => Vector3} options.getOrigin
 * @param {Player[]} options.players
 * @returns {boolean}
 */
export function initializeIslands({ dimension, unlockProperty, islands, getOrigin, players }) {
	if (world.getDynamicProperty(unlockProperty)) {
		debugMsg(`Dimension already initialized: ${dimension.id}`);
		return false;
	}
	if (!islands || islands.length === 0) return false;
	const origin = getOrigin(players[0]);
	debugMsg(`Origin Found: ${coordsString(origin)} — Awaiting island generation.`);
	for (const player of players) {
		suspendPlayer(
			player,
			{
				x: origin.x + 0.5,
				y: origin.y,
				z: origin.z + 0.5,
			},
			10,
		);
	}
	// Thanks Lyvvy <3
	for (const island of islands) {
		generateIsland(island, origin);
	}
	world.setDynamicProperty(unlockProperty, true);
	debugMsg(
		`Dynamic Property "${unlockProperty}" set to ${world.getDynamicProperty(unlockProperty)}`,
	);
	return true;
}
