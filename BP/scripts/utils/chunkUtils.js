import { BlockVolume, Block, Vector3, VectorXZ, system, Dimension } from "@minecraft/server";
import { coordsString, debugMsg } from "../utils/debugUtils";

/**
 * Resolves once the chunk containing the given location is loaded.
 *
 * @param {Dimension} dimension - Dimension to wait for load in.
 * @param {Vector3} location - Location to wait for load.
 * @param {number} intervalTicks - Poll interval (defaul: 20, 1 second.)
 * @param {number} timeoutTicks - Cutoff time in ticks (default: 1200, 1 minute.).
 * @returns {Promise<void>}
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
 * Creates a circular ticking area centered at a location.
 * * Ensures blocks remain loaded during asynchronous operations.
 *
 * @param {Dimension} dimension - Target dimension.
 * @param {Vector3} location - Center point.
 * @param {string} name - Unique ticking area name.
 */

export function createTickingArea(dimension, location, name) {
	dimension.runCommand(`tickingarea add circle ${coordsString(location, "command")} 2 ${name}`);
	debugMsg(`Ticking area "${name}" created at ${coordsString(location)}`);
}

/**
 * Removes a previously created ticking area by name.
 *
 * @param {Dimension} dimension - Target dimension.
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
 * @param {Dimension} dimension
 * @param {BlockVolume} volume
 * @param {(block: Block) => (void | boolean)} func
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
 * @param {VectorXZ} centerChunk - Center chunk coordinate
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
 * @param {Dimension} dimension
 * @param {Vector3|BlockVolume} location
 * @param {string} permId
 * @param {number|boolean|string} permValue
 */
export function applyPermToLocation(dimension, location, permId, permValue) {
	applyFuncToLocation(dimension, location, (block) => {
		applyPerm(block, permId, permValue);
	});
}

/**
 * Applies a function to a single block or block volume.
 *
 * @param {Dimension} dimension
 * @param {Vector3|BlockVolume} location
 * @param {(block: Block) => void} func
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
 * @param {Block} block
 * @param {string} permId
 * @param {number|boolean|string} permValue
 */
export function applyPerm(block, permId, permValue) {
	block.setPermutation(block.permutation.withState(permId, permValue));
}

/**
 * Converts chunk locations into coordinates.
 *
 * @param {import("@minecraft/server").VectorXZ} chunk
 * @param {number} yLevel
 * @returns {Vector3}
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
 * @param {Dimension} dimension
 * @param {VectorXZ} chunk
 * @param {import("@minecraft/common").NumberRange} bounds
 * @param {(block: Block) => boolean} predicate
 * @param {(block: Block) => void} func
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
 * @param {Dimension} dimension
 * @param {BlockVolume} from
 * @param {(block: Block) => boolean} predicate
 * @param {(block: Block) => void} func
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
 * @param {Dimension} dimension
 * @param {BlockVolume} volume
 * @param {(block: Block) => boolean} predicate
 * @returns {Block|undefined}
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

export function sameChunkAsLast(playerInfo, playerChunk) {
	return (
		playerInfo.lastChunk &&
		playerInfo.lastChunk.x === playerChunk.x &&
		playerInfo.lastChunk.z === playerChunk.z
	);
}

/**
 *
 * @param {VectorXZ} chunk
 * @returns {string}
 */
export function chunksString(chunk) {
	return `(X: ${chunk.x}, Z: ${chunk.z})`;
}

/**
 *
 * @param {Dimension} dimension
 * @param {BlockVolume|Vector3|VectorXZ} location
 * @param {string} biome
 * @returns
 */
export function hasBiome(dimension, location, biome) {
	// BlockVolume (real class)
	if (location instanceof BlockVolume) {
		return findFirstMatchingBlock(
			dimension,
			location,
			(block) => dimension.getBiome(block.location)?.id === biome,
		);
	}
	// Vector3-like { x, y, z }
	if (
		location &&
		typeof location.x === "number" &&
		typeof location.y === "number" &&
		typeof location.z === "number"
	) {
		return dimension.getBiome(location)?.id === biome;
	}
	// VectorXZ-like { x, z }
	if (location && typeof location.x === "number" && typeof location.z === "number") {
		return findBlockInChunk(
			dimension,
			location,
			{ min: dimension.heightRange.min, max: dimension.heightRange.max },
			(block) => dimension.getBiome(block.location)?.id === biome,
		);
	}
	return false;
}
