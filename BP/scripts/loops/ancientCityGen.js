import { MemoryTier, world } from "@minecraft/server";
import { playerInfoMaps } from "../cache/playersCache";
import { debugMsg } from "../utils/debugUtils";
import { chunkHasDeepDark, findTargetBlock } from "../utils/ancientCityUtils";

export function ancientCityGen(initialized) {
	if (!initialized) return;
	for (const playerInfoMap of playerInfoMaps.values()) {
		const player = playerInfoMap.player;
		const dimension = player?.dimension;
		if (!dimension) continue;
		const playerChunkX = Math.floor(player.location.x / 16);
		const playerChunkZ = Math.floor(player.location.z / 16);
		// Skip if player hasn’t changed chunks
		if (playerInfoMap.lastChunkX === playerChunkX && playerInfoMap.lastChunkZ === playerChunkZ)
			continue;
		playerInfoMap.lastChunkX = playerChunkX;
		playerInfoMap.lastChunkZ = playerChunkZ;
		debugMsg(`Players chunk is (X: ${playerInfoMap.lastChunkX}, Z: ${playerInfoMap.lastChunkZ})`);
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
		for (let distanceX = -radius; distanceX <= radius; distanceX++) {
			for (let distanceZ = -radius; distanceZ <= radius; distanceZ++) {
				const chunkX = playerChunkX + distanceX;
				const chunkZ = playerChunkZ + distanceZ;
				// Skip already checked chunks
				const key = `kado:chunkLoaded-(${chunkX}:${chunkZ})`;
				if (world.getDynamicProperty(key)) continue;
				if (!dimension.isChunkLoaded({ x: chunkX * 16, y: 0, z: chunkZ * 16 })) continue;
				if (!chunkHasDeepDark) continue;
				findTargetBlock(dimension, chunkX, chunkZ);
				world.setDynamicProperty(key, true);
			}
		}
	}
}
