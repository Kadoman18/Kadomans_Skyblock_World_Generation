import { world } from "@minecraft/server";
import { getIslandDefs } from "../../registry/islandDefs";
import { initializeIslands } from "../../utils/islandGenUtils";

world.afterEvents.playerDimensionChange.subscribe((eventData) => {
	const { player, toDimension, toLocation, fromDimension, fromLocation } = eventData;
	if (toDimension.id !== "minecraft:nether") return;
	initializeIslands({
		dimension: toDimension,
		unlockProperty: "kado:nether_unlocked",
		islands: getIslandDefs("minecraft:nether"),
		players: [player],
		getOrigin: () => ({
			x: toLocation.x,
			y: toLocation.y + 5,
			z: toLocation.z,
		}),
	});
});
