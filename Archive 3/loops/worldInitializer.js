import { world } from "@minecraft/server";
import { registerPlayer, playerInfoMaps } from "../cache/playersCache";
import { initializeIslands } from "../utils/islandGenUtils";
import { getIslandDefs } from "../registry/islandDefs";

export function worldInitializer() {
	const players = world.getAllPlayers();
	if (players.length === 0) return false;
	initializePlayersRegistry(players);
	return initializeIslands({
		dimension: world.getDimension("minecraft:overworld"),
		unlockProperty: "kado:overworld_unlocked",
		islands: getIslandDefs().overworld,
		players,
		getOrigin: () => ({
			x: world.getDefaultSpawnLocation().x,
			y: 65,
			z: world.getDefaultSpawnLocation().z,
		}),
	});
}

function initializePlayersRegistry(players) {
	// Initialize player registry
	for (const player of players) {
		registerPlayer(player);
	}
	console.log(`Initialized player registry with ${playerInfoMaps.size} players.`);
}
