import { system, BlockVolume, world } from "@minecraft/server";
import { coordsString, debugMsg, typeIdify } from "../utils/debugUtils";
import { calculateOffsets } from "../utils/mathUtils";

/**
 * Resolves once the chunk containing the given location is loaded.
 *
 * Side effects:
 * - Creates and removes a temporary ticking area
 * - Polls chunk load state on an interval
 *
 * Failure cases:
 * - Dimension becomes invalid
 * - Operation is aborted before completion
 *
 * @param {import("@minecraft/server").Dimension} dimension - Dimension to wait for load in.
 * @param {import("@minecraft/server").Vector3} location - World location whose chunk must be loaded.
 * @param {number} intervalTicks - Poll interval in ticks (minimum 1).
 * @returns {Promise<boolean>} - Resolves `true` if the chunk loads successfully, `false` otherwise.
 */
// butts=-2(chunky+5buttnut)*overbort/futbutt08dups
export function waitForChunkLoaded(dimension, location, intervalTicks = 20, timeoutTicks = 1200) {
	return new Promise((resolve, reject) => {
		let waited = 0;
		const check = system.runInterval(() => {
			waited += intervalTicks;
			try {
				const block = dimension.getBlock(location);
				if (block) {
					system.clearRun(check);
					resolve();
				}
			} catch {}

			if (waited >= timeoutTicks) {
				system.clearRun(check);
				reject(new Error("Chunk load timeout"));
			}
		}, intervalTicks);
	});
}

/**
 * Creates a temporary ticking area covering a single chunk.
 *
 * Ownership:
 * - The caller is responsible for removing the ticking area via `removeTickingArea`.
 *
 * @param {import("@minecraft/server").Dimension} dimension - Dimension in which to create the ticking area.
 * @param {number} chunkX - Chunk X coordinate.
 * @param {number} chunkZ - Chunk Z coordinate.
 * @returns {string} - Identifier of the created ticking area.
 */
export function createTickingArea(dimension, location, name) {
	dimension.runCommand(`tickingarea add circle ${coordsString(location, "command")} 2 ${name}`);
	debugMsg(`Ticking area "${name}" created at ${coordsString(location)}`);
}

/**
 * Removes a previously created ticking area by name.
 *
 * @param {import("@minecraft/server").Dimension} dimension - Target dimension.
 * @param {string} name - Ticking area identifier.
 */
export function removeTickingArea(dimension, name) {
	dimension.runCommand(`tickingarea remove ${name}`);
	debugMsg(`Ticking area "${name}" removed`);
}

/**
 * Iterates all blocks in a volume.
 * If the callback returns false, iteration stops early.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").BlockVolume} volume
 * @param {(block: import("@minecraft/server").Block) => (void | boolean)} func
 */
export function iterateBlockVolume(dimension, volume, func) {
	const minX = Math.min(volume.from.x, volume.to.x);
	const maxX = Math.max(volume.from.x, volume.to.x);
	const minY = Math.min(volume.from.y, volume.to.y);
	const maxY = Math.max(volume.from.y, volume.to.y);
	const minZ = Math.min(volume.from.z, volume.to.z);
	const maxZ = Math.max(volume.from.z, volume.to.z);
	for (let x = minX; x <= maxX; x++) {
		for (let y = minY; y <= maxY; y++) {
			for (let z = minZ; z <= maxZ; z++) {
				const block = dimension.getBlock({ x, y, z });
				if (!block) continue;

				if (func(block) === false) {
					return;
				}
			}
		}
	}
}

/**
 * Iterates over chunk coordinates in a circular radius around a center chunk.
 *
 * @param {import("@minecraft/server").VectorXZ} centerChunk - Center chunk coordinate
 * @param {number} radius - Circular chunk radius
 * @param {(import("@minecraft/server").VectorXZ) => void} callback - Invoked for each chunk
 */
export function iterateChunksCircular(centerChunk, radius, callback) {
	const radiusSquared = radius ** 2;
	for (let offsetX = -radius; offsetX <= radius; offsetX++) {
		for (let offsetZ = -radius; offsetZ <= radius; offsetZ++) {
			if (offsetX * offsetX + offsetZ * offsetZ > radiusSquared) continue;
			callback({
				x: centerChunk.x + offsetX,
				z: centerChunk.z + offsetZ,
			});
		}
	}
}

/**
 * Applies a block permutation to a location.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3|import("@minecraft/server").BlockVolume} location
 * @param {import("./typedefs").PermDef[]} perms
 */
export function applyPermsToLocation(dimension, location, perms) {
	applyFuncToLocation(dimension, location, (block) => {
		applyPermsToBlock(block, perms);
	});
}

/**
 * Applies a function to a single block or block volume.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3|import("@minecraft/server").BlockVolume} location
 * @param {(block: import("@minecraft/server").Block) => void} func
 */
export function applyFuncToLocation(dimension, location, func) {
	if (location instanceof BlockVolume) {
		iterateBlockVolume(dimension, location, func);
		return;
	}
	const block = dimension.getBlock(location);
	if (!block) return;
	func(block);
}

/**
 * Applies a permutation state to a block.
 *
 * @param {import("@minecraft/server").Block} block
 * @param {import("./typedefs").PermDef[]} perms
 */
export function applyPermsToBlock(block, perms) {
	for (const perm of perms) {
		block.setPermutation(block.permutation.withState(perm.id, perm.value));
	}
}

/**
 * Converts chunk locations into coordinates.
 *
 * @param {import("@minecraft/server").VectorXZ} chunk
 * @param {number} yLevel
 * @returns {import("@minecraft/server").Vector3}
 */
export function convertChunkToCoords(chunk, yLevel = 0) {
	if (!chunk || !Number.isInteger(chunk.x) || !Number.isInteger(chunk.z)) {
		throw new Error(`Invalid chunk: ${JSON.stringify(chunk)}`);
	}
	return {
		x: chunk.x * 16,
		y: yLevel,
		z: chunk.z * 16,
	};
}

/**
 * Finds a block in a given chunk, verifies it matches the predicate, then executes a function on that block.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").VectorXZ} chunk
 * @param {import("@minecraft/common").NumberRange} bounds
 * @param {(block: import("@minecraft/server").Block) => boolean} predicate
 * @param {(block: import("@minecraft/server").Block) => void} func
 * @returns {boolean|undefined}
 */
export function findBlockInChunk(dimension, chunk, bounds, predicate, func = undefined) {
	const volume = new BlockVolume(
		{
			x: chunk.x * 16,
			y: bounds.min,
			z: chunk.z * 16,
		},
		{
			x: chunk.x * 16 + 15,
			y: bounds.max,
			z: chunk.z * 16 + 15,
		},
	);
	if (func) {
		findFirstMatchingBlock(dimension, volume, predicate, func);
	} else {
		return findFirstMatchingBlock(dimension, volume, predicate, func) ? true : false;
	}
}

/**
 * Finds the first matching block in a volume and optionally applies a function to it.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").BlockVolume} from
 * @param {(block: import("@minecraft/server").Block) => boolean} predicate
 * @param {(block: import("@minecraft/server").Block) => void} func
 * @returns {boolean} true if a block was found
 */
export function findFirstMatchingBlock(dimension, volume, predicate, func = undefined) {
	const block = findBlockInVolume(dimension, volume, predicate);
	if (!block) return false;
	if (func) func(block);
	return true;
}

/**
 * Finds the first block in a volume that matches a predicate.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").BlockVolume} volume
 * @param {(block: import("@minecraft/server").Block) => boolean} predicate
 * @returns {import("@minecraft/server").Block|undefined}
 */
export function findBlockInVolume(dimension, volume, predicate) {
	let found;
	iterateBlockVolume(dimension, volume, (block) => {
		if (!predicate(block)) return;
		found = block;
		return false;
	});
	return found;
}

/**
 *
 * @param {import("@minecraft/server").VectorXZ} chunk
 * @returns {string}
 */
export function chunksString(chunk) {
	return `(X: ${chunk.x}, Z: ${chunk.z})`;
}

/**
 * Searches a chunk on a grid of roughly 3 blocks apart to sample between a given height min and max for a biome.
 *
 * @param {import("@minecraft/server").Dimension} dimension - Dimension of the chunk being searched.
 * @param {import("@minecraft/server").VectorXZ} chunk - Chunk being searched.
 * @param {string} biome - Biome to search for.
 * @param {import("@minecraft/common").NumberRange} bounds - Vertical search bounds.
 * @returns {boolean}
 */
export function hasBiome(dimension, chunk, biome, bounds) {
	return searchChunk(
		dimension,
		chunk,
		(block) => dimension.getBiome(block.location).id === biome,
		bounds,
	);
}

/**
 * Finds a block in a given chunk, verifies it matches the predicate, then executes a function on that block.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").VectorXZ} chunk
 * @param {import("@minecraft/common").NumberRange} bounds
 * @param {import("./typedefs").ReplacementConfig} blockMap
 * @param {(block: import("@minecraft/server").Block) => void} func
 * @returns {boolean|undefined}
 */
export function replaceBlockInChunk(dimension, chunk, bounds, blockMap, onApplied) {
	const volume = new BlockVolume(
		{
			x: chunk.x * 16,
			y: bounds.min,
			z: chunk.z * 16,
		},
		{
			x: chunk.x * 16 + 15,
			y: bounds.max,
			z: chunk.z * 16 + 15,
		},
	);
	let applied = false;
	iterateBlockVolume(dimension, volume, (block) => {
		/** @type {import("./typedefs").ReplacementConfig>} */
		const config = blockMap[block.typeId];
		if (!config) return;
		if (config.replaceWithBlock) {
			dimension.setBlockType(block.location, "minecraft:air"); // Replace block so new block placement succeeds
			dimension.setBlockType(block.location, config.replaceWithBlock);
			debugMsg(
				`Block ${typeIdify(block.typeId)} at ${coordsString(block.location)} replaced with ${typeIdify(
					config.replaceWithBlock,
				)}`,
			);
		}
		if (config.permutations) {
			for (const permutation of config.permutations) {
				applyPermsToBlock(block, [{ id: permutation.id, value: permutation.value }]);
				debugMsg(
					`Permutation ${
						permutation.id
					} applied to ${typeIdify(block.typeId)} block at ${coordsString(block.location)} with value - ${
						permutation.value
					}`,
				);
			}
		}
		if (config.summonEntity) {
			const entity = dimension.spawnEntity(
				config.summonEntity.id,
				calculateOffsets(block.location, config.summonEntity.offset),
				{ initialPersistence: true },
			);
			debugMsg(
				`Entity ${typeIdify(config.summonEntity.id)} placed at ${coordsString(block.location)}`,
			);
			if (config.summonEntity.spawnEvents) {
				for (const event of config.summonEntity.spawnEvents) {
					entity.triggerEvent(event);
					debugMsg(
						`Spawn event ${typeIdify(event)} applied to entity ${typeIdify(config.summonEntity.id)} at ${coordsString(block.location)}`,
					);
				}
			}
		}
		onApplied?.(block);
		applied = true;
		return false;
	});
	return applied;
}

/**
 * Checks to see if the chunk a player is currently in, is the same as the chunk they were last checked to be in.
 *
 * @param {import(@minecraft/server).VectorXZ} lastChunk
 * @param {import(@minecraft/server).VectorXZ} playerChunk
 * @returns {boolean}
 */
export function sameChunkAsLast(lastChunk, playerChunk) {
	return lastChunk.x === playerChunk.x && lastChunk.z === playerChunk.z;
}

/**
 * Searches a chunk by sampling 9 equidistant points per Y-layer until a match is found.
 *
 * @param {import("@minecraft/server").Dimension} dimension - Dimension to search in.
 * @param {import("@minecraft/server").Vector3} chunkOrigin - World-space origin of the chunk (NW bottom corner).
 * @param {(block: import("@minecraft/server").Block) => boolean} predicate - Match condition.
 * @param {import("@minecraft/common").NumberRange} bounds - Vertical search bounds.
 * @returns {import("@minecraft/server").Block|undefined}
 */
export function searchChunk(dimension, chunkOrigin, predicate, bounds) {
	const heightRange = dimension.heightRange;
	const minY = Math.max(bounds.min, heightRange.min);
	const maxY = Math.min(bounds.max, heightRange.max);
	const startXZ = { x: chunkOrigin.x * 16, z: chunkOrigin.z * 16 };
	for (let y = minY; y <= maxY; y += 3) {
		for (const offsetX of [2, 5, 9, 12]) {
			for (const offsetZ of [2, 5, 9, 12]) {
				const location = {
					x: startXZ.x + offsetX,
					y: y,
					z: startXZ.z + offsetZ,
				};
				const block = dimension.getBlock(location);
				if (!block) continue;
				if (predicate(block)) {
					return true;
				}
			}
		}
	}
	return undefined;
}

/**
 * Normalizes given search range, takes a range or a number, and outputs a range.
 *
 * @param {import("@minecraft/common").NumberRange|number} searchLocation
 * @returns {import("@minecraft/common").NumberRange}
 */
export function normalizeSearchRange(searchLocation) {
	if (typeof searchLocation === "number") {
		return { min: searchLocation, max: searchLocation };
	}
	return searchLocation;
}
