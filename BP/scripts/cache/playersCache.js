import { MemoryTier, Player } from "@minecraft/server";

/** @type {Map<string, PlayerInfo>} */
export const playerInfoMaps = new Map();

/**
 * @typedef {Object} PlayerInfo
 * @property {Player} player
 * @property {number} memoryTier
 * @property {number} lastChunkX
 * @property {number} lastChunkZ
 */

/**
 * Registers a player object to the cache to save on I/O.
 *
 * @param {Player} player - Player object to register to cache.
 */

export function registerPlayer(player) {
	playerInfoMaps.set(player.id, {
		player,
		memoryTier: player.clientSystemInfo?.memoryTier ?? MemoryTier.Low,
		lastChunkX: undefined,
		lastChunkZ: undefined,
	});
}
