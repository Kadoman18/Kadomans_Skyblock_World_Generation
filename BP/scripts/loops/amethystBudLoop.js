import { world } from "@minecraft/server";
import { validGeode, randomBudAmDelay } from "../utils/renewAmethystUtils";
import { parseCoordsFromId } from "../utils/customVaultUtils";
import { debugMsg, ticksToTime, coordsString } from "../utils/debugUtils";

export function processAmethystBuds(initialized) {
	if (!initialized) return;
	const propIds = world.getDynamicPropertyIds();
	for (const propId of propIds) {
		if (!propId.startsWith("kado:budAmWater-")) continue;
		const remaining = world.getDynamicProperty(propId);
		const waterBlockLoc = parseCoordsFromId(propId);
		if (!waterBlockLoc) {
			world.setDynamicProperty(propId, undefined);
			continue;
		}
		const dimension = world.getDimension(propId.split("-")[1]);
		if (!dimension) continue;
		const block = dimension.getBlock(waterBlockLoc);
		if (!block) continue;
		// Water removed -> forget
		if (block.typeId !== "minecraft:water") {
			world.setDynamicProperty(propId, undefined);
			continue;
		}
		if (!dimension.isChunkLoaded(block.location)) continue;
		const geodeState = validGeode(dimension, waterBlockLoc);
		debugMsg(`Geode State: ${geodeState}`);
		// Some blocks not loaded -> pause (do nothing)
		if (geodeState === undefined) {
			continue;
		}
		// Structure broken -> reset delay
		if (geodeState === false) {
			world.setDynamicProperty(propId, randomBudAmDelay());
			continue;
		}
		// geodeState === true -> countdown
		const newDelay = Math.max(remaining - 20, 0);
		world.setDynamicProperty(propId, newDelay);
		if (newDelay % 600 === 0) {
			const time = ticksToTime(newDelay);
			debugMsg(`[${propId}] Cooldown: ${time.minutes}m ${time.seconds}s`, false);
		}
		if (newDelay === 0) {
			dimension.setBlockType(waterBlockLoc, "minecraft:budding_amethyst");
			world.setDynamicProperty(propId, undefined);
			debugMsg(
				`World Dynamic Property '${propId}' set to ${world.getDynamicProperty(
					propId,
				)} and removed.\nWater at ${coordsString(
					waterBlockLoc,
				)} converted to Buddding Amethyst.`,
				false,
			);
		}
		continue;
	}
}
