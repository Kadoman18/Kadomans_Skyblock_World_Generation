import { world } from "@minecraft/server";
import { netherIslands } from "../../registry/islandDefs";
import { debugMsg, coordsString } from "../../utils/debugUtils";
import { suspendPlayer, generateIsland } from "../../utils/islandGenUtils";

world.afterEvents.playerDimensionChange.subscribe((eventData) => {
	const { player, toDimension, toLocation, fromDimension, fromLocation } = eventData;
	if (toDimension.id === "minecraft:overworld") {
		debugMsg(`This world's overworld has already been initialized`);
		return;
	} else if (
		toDimension.id === "minecraft:nether" &&
		world.getDynamicProperty("kado:nether_unlocked")
	) {
		debugMsg(`This world's nether has already been initialized`);
		return;
	} else if (toDimension.id === "minecraft:the_end") return;
	debugMsg(`toLocation: ${coordsString(toLocation)}`);
	debugMsg(`player.location: ${coordsString(player.location)}`);
	const origin = { x: toLocation.x, y: toLocation.y + 5, z: toLocation.z };
	suspendPlayer(player, { x: origin.x + 0.5, y: origin.y, z: origin.z + 0.99 }, 10);
	debugMsg(`Origin Found: ${coordsString(origin)}\n${player.name} awaiting island generation.`);
	for (const island of netherIslands) generateIsland(island, origin);
	world.setDynamicProperty("kado:nether_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:nether_unlocked" - ${world.getDynamicProperty(
			"kado:nether_unlocked",
		)}`,
	);
});
