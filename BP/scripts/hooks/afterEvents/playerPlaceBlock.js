import { world } from "@minecraft/server";
import { scanForCrystallineWater } from "../../utils/renewAmethystUtils";

world.afterEvents.playerPlaceBlock.subscribe((eventData) => {
	const { player, block, dimension } = eventData;
        if (block.typeId !== "minecraft:smooth_basalt") return;
        scanForCrystallineWater(dimension, block.location);
});