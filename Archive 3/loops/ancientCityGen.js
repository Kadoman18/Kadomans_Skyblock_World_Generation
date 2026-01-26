import { world } from "@minecraft/server";
import { playerInfoMaps } from "../cache/playersCache";
import { chunksString, debugMsg } from "../utils/debugUtils";
import {
	hasBiome,
	findBlockInChunk,
	iterateChunksCircular,
	convertChunkToCoords,
	applyPermToLocation,
	sameChunkAsLast,
} from "../utils/chunkUtils";

export function ancientCityGen(initialized) {
	if (!initialized) return;
	for (const playerInfoMap of playerInfoMaps.values()) {
		const player = playerInfoMap.player;
		const dimension = player?.dimension;
		if (!dimension || dimension.id === "overworld") continue;
		const playerChunk = {
			x: Math.floor(player.location.x / 16),
			z: Math.floor(player.location.z / 16),
		};
		// Skip if player hasn’t changed chunks
		if (sameChunkAsLast(playerInfoMap, playerChunk)) continue;
		playerInfoMap.lastChunk = playerChunk;
		debugMsg(`Players chunk is ${chunksString(playerChunk)}`);
		let radius;
		switch (playerInfoMap.memoryTier) {
			case 0: // Super Low
				radius = 8;
				break;
			case 1: // Low
				radius = 10;
				break;
			case 2: // Mid
				radius = 12;
				break;
			case 3: // High
				radius = 16;
				break;
			case 4: // Super High
				radius = 25;
				break;
			default:
				radius = 8;
		}
		debugMsg(`Memory Tier: ${playerInfoMap.memoryTier}\nTarget Scan Radius: ${radius} (Chunks)`);
		iterateChunksCircular(playerChunk, radius, (chunk) => {
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
