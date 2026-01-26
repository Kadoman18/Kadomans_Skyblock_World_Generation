import { MemoryTier, Player, VectorXZ } from "@minecraft/server";

/** @type {Map<string, PlayerInfo>} */
export const playerInfoMaps = new Map();

/**
 * @typedef {Object} PlayerInfo
 * @property {Player} player
 * @property {number} genRadius
 * @property {VectorXZ} lastChunk
 */

/**
 * Registers a player object to the cache to save on I/O.
 *
 * @param {Player} player - Player object to register to cache.
 */
export function registerPlayer(player) {
	playerInfoMaps.set(player.id, {
		player,
		genRadius: getRadius(player),
		lastChunk: undefined,
	});
}

function getRadius(player) {
	switch (player.clientSystemInfo?.memoryTier) {
		case 0: // Super Low
			return 8;
		case 1: // Low
			return 10;
		case 2: // Mid
			return 12;
		case 3: // High
			return 16;
		case 4: // Super High
			return 25;
		default:
			return 8;
	}
}
