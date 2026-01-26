import { BlockVolume } from "@minecraft/server";
import { findFirstMatchingBlock, findBlockInChunk } from "./chunkUtils";

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

// return location.some((pos) => overworld.getBiome(pos)?.id === "minecraft:deep_dark");
