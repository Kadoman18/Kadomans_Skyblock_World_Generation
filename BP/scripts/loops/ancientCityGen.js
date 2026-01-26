import { world } from "@minecraft/server";
import { playerInfoMaps } from "../cache/playersCache";
import { debugMsg } from "../utils/debugUtils";
import {
	applyPermToLocation,
	chunksString,
	convertChunkToCoords,
	findBlockInChunk,
	hasBiome,
	iterateChunksCircular,
	sameChunkAsLast,
} from "../utils/chunkUtils";

export function ancientCityGen(initialized) {
	if (!initialized) return;
	for (const playerInfoMap of playerInfoMaps.values()) {
		const { player, genRadius } = playerInfoMap;
		const { dimension } = player;
		if (!dimension || dimension.id !== "minecraft:overworld") continue;
		const currentChunk = {
			x: Math.floor(player.location.x / 16),
			z: Math.floor(player.location.z / 16),
		};
		// Skip if player hasn’t changed chunks
		if (playerInfoMap.lastChunk && sameChunkAsLast(playerInfoMap.lastChunk, currentChunk))
			continue;
		playerInfoMap.lastChunk = currentChunk;
		debugMsg(`Players chunk is ${chunksString(currentChunk)}`);
		iterateChunksCircular(currentChunk, genRadius, (chunk) => {
			// Skip already checked chunks
			const key = `kado:chunkLoaded-(${chunk.x}:${chunk.z})`;
			if (
				world.getDynamicProperty(key) ||
				!dimension.isChunkLoaded(convertChunkToCoords(chunk, player.location.y)) ||
				!hasBiome(dimension, convertChunkToCoords(chunk, -48), "minecraft:deep_dark")
			)
				return;
			findBlockInChunk(
				dimension,
				chunk,
				{ min: -48, max: -48 },
				(block) => block.typeId === "minecraft:target",
				(block) => {
					dimension.setBlockType(block.location, "minecraft:sculk_shrieker");
					applyPermToLocation(dimension, block.location, "can_summon", true);
					player.playSound("power.on.sculk_sensor");
				},
			);
			world.setDynamicProperty(key, true);
		});
	}
}
