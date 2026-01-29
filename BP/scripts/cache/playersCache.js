/** @type {Map<string, PlayerInfo>} */
export const playerInfoMaps = new Map();

/**
 * Cached, per‑player runtime data used to reduce repeated world queries
 * and drive generation heuristics.
 *
 * @typedef {Object} PlayerInfo
 * @property {import("@minecraft/server").Player} player
 * Player entity associated with this cache entry.
 *
 * @property {number} genRadius
 * Chunk‑generation radius derived from the player's memory tier.
 *
 * @property {import("@minecraft/server").VectorXZ | undefined} lastChunk
 * Last processed chunk for this player, or `undefined` if none has been processed yet.
 *
 * @property {number | undefined} lastChunkCheckPoll
 * Tick timestamp of the last chunk-generation poll for this player.
 */

/**
 * Registers a player in the runtime cache.
 *
 * Side effects:
 * - Creates a new cache entry keyed by `player.id`
 * - Computes and stores generation radius
 *
 * @param {import("@minecraft/server").Player} player
 * Player to register.
 */
export function registerPlayer(player) {
	playerInfoMaps.set(player.id, {
		player,
		genRadius: getRadius(player),
		lastChunk: undefined,
		lastChunkCheckPoll: undefined,
	});
}

/**
 * Computes a chunk‑generation radius based on client memory tier and max render distance.
 *
 * Falls back to a conservative default if tier data is unavailable.
 *
 * @param {import("@minecraft/server").Player} player - Player whose client capabilities are evaluated.
 * @returns {number} Generation radius in chunks.
 */
function getRadius(player) {
	switch (player.clientSystemInfo?.memoryTier) {
		case 0: // Super Low
			return Math.min(player.clientSystemInfo.maxRenderDistance, 10);
		case 1: // Low
			return Math.min(player.clientSystemInfo.maxRenderDistance, 12);
		case 2: // Mid
			return Math.min(player.clientSystemInfo.maxRenderDistance, 16);
		case 3: // High
			return Math.min(player.clientSystemInfo.maxRenderDistance, 25);
		case 4: // Super High
			return Math.min(player.clientSystemInfo.maxRenderDistance, 32);
		default:
			return Math.min(player.clientSystemInfo.maxRenderDistance, 10);
	}
}
