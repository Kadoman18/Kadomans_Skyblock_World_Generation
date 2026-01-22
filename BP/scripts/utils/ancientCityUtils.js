import { debugMsg, coordsString } from "./debugUtils";

// --------------------------------------------------
// Ancient City Shrieker Utilities
// --------------------------------------------------
/**
 * Checks whether a chunk contains any Deep Dark biome samples.
 * @param {Dimension} overworld
 * @param {number} chunkX
 * @param {number} chunkZ
 * @returns {boolean}
 */

export function chunkHasDeepDark(overworld, chunkX, chunkZ) {
	return (
		overworld.getBiome({ x: chunkX * 16 + 8, y: -48, z: chunkZ * 16 + 8 })?.id ===
		"minecraft:deep_dark"
	);
}
/**
 * Finds all sculk shriekers in a chunk.
 * @param {Dimension} dimension
 * @param {number} chunkX
 * @param {number} chunkZ
 */

export function findTargetBlock(dimension, chunkX, chunkZ) {
	const startX = chunkX * 16;
	const startZ = chunkZ * 16;
	for (let x = 0; x < 16; x++) {
		for (let z = 0; z < 16; z++) {
			const block = dimension.getBlock({ x: startX + x, y: -48, z: startZ + z });
			if (!block) continue;
			if (block.typeId === "minecraft:target") {
				dimension.setBlockType(block.location, "minecraft:sculk_shrieker");
				const shrieker = dimension.getBlock(block.location);
				shrieker.setPermutation(shrieker.permutation.withState("can_summon", true));
				debugMsg(
					`Target at ${coordsString(shrieker.location)} converted into summonable shrieker.`,
				);
				break;
			}
		}
        }
}
