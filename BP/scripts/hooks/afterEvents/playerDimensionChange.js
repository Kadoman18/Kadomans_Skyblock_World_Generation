import { world } from "@minecraft/server";
import { initializeIslands, makeUnlockKey } from "../../utils/islandGenUtils";

world.afterEvents.playerDimensionChange.subscribe((eventData) => {
	const { player, toDimension, toLocation, fromDimension, fromLocation } = eventData;
	if (world.getDynamicProperty(makeUnlockKey(toDimension))) return;
	initializeIslands(player);
});
