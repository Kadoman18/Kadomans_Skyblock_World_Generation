import { world } from "@minecraft/server";
import { debugMsg, coordsString } from "../../utils/debugUtils";
import { randomBudAmDelay } from "../../utils/renewAmethystUtils";

world.afterEvents.playerInteractWithBlock.subscribe((eventData) => {
	const { player, beforeItemStack, itemStack, block, blockFace, faceLocation, isFirstEvent } =
		eventData;
	if (
		(beforeItemStack?.typeId === "minecraft:water_bucket" &&
			itemStack?.typeId === "minecraft:bucket" &&
			player.getGameMode() === "Survival") ||
		(beforeItemStack?.typeId === "minecraft:water_bucket" &&
			(itemStack?.typeId === "minecraft:bucket" ||
				itemStack?.typeId === "minecraft:water_bucket") &&
			player.getGameMode() === "Creative")
	) {
		// Water placed
		let tempBlock;
		switch (blockFace) {
			case "Up": {
				tempBlock = block.above();
				break;
			}
			case "North": {
				tempBlock = block.north();
				break;
			}
			case "East": {
				tempBlock = block.east();
				break;
			}
			case "South": {
				tempBlock = block.south();
				break;
			}
			case "West": {
				tempBlock = block.west();
				break;
			}
			case "Down": {
				tempBlock = block.below();
				break;
			}
			default: {
				tempBlock = undefined;
				break;
			}
		}
		if (tempBlock.typeId !== "minecraft:water") return;
		const placedWaterBlock = tempBlock;
		const delay = randomBudAmDelay();
		const propId = `kado:budAmWater-${player.dimension.id}-${coordsString(
			placedWaterBlock.location,
			"id",
		)}`;
		world.setDynamicProperty(propId, delay);
		debugMsg(
			`World Dynamic Property '${propId}' set to world with a value of ${world.getDynamicProperty(
				propId,
			)}.`,
			false,
		);
		return;
	}
	// Water picked up
	if (
		(beforeItemStack?.typeId === "minecraft:bucket" &&
			itemStack?.typeId === "minecraft:water_bucket" &&
			player.getGameMode() === "Survival") ||
		(beforeItemStack?.typeId === "minecraft:water_bucket" &&
			itemStack?.typeId === "minecraft:water_bucket" &&
			player.getGameMode() === "Creative")
	) {
		const propId = `kado:budAmWater-${player.dimension.id}-${coordsString(block.location, "id")}`;
		world.setDynamicProperty(propId, undefined);
		debugMsg(
			`World Dynamic Property '${propId}' set to ${world.getDynamicProperty(
				propId,
			)} and removed.`,
			false,
		);
	}
});
