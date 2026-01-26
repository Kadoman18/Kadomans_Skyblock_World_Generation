import { world } from "@minecraft/server";
import { registerPlayer, playerInfoMaps } from "../cache/playersCache";
import { initializeIslands } from "../utils/islandGenUtils";

export function worldInitializer() {
	// Wait until at least one player exists
	const allPlayers = world.getAllPlayers();
	if (allPlayers.length === 0) return false;
	// Initialize player registry
	for (const player of allPlayers) {
		registerPlayer(player);
		console.log(`Initialized player registry with ${playerInfoMaps.size} players.`);
		initializeIslands(player);
	}
	return true;
}
