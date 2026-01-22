import { world } from "@minecraft/server";
import { suspendPlayer, generateIsland } from "../../utils/islandGenUtils";
import { debugMsg, coordsString } from "../../utils/debugUtils";
import { overworldIslands } from "../../registry/islandDefs";

world.afterEvents.playerSpawn.subscribe((eventData) => {
	const { player, initialSpawn } = eventData;
	if (world.getDynamicProperty("kado:overworld_unlocked")) {
		debugMsg(`This world's overworld has already been initialized`);
		return;
	}
	const spawn = {
		x: world.getDefaultSpawnLocation().x,
		y: 65,
		z: world.getDefaultSpawnLocation().z,
	};
	debugMsg(`Spawn Found: ${coordsString(spawn)}\n${player.name} awaiting island generation.`);
	suspendPlayer(player, { x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 });
	// Thanks Lyvvy <3
	for (const island of overworldIslands) generateIsland(island, spawn);
	world.setDynamicProperty("kado:overworld_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:overworld_unlocked" - ${world.getDynamicProperty(
			"kado:overworld_unlocked",
		)}`,
	);
});
