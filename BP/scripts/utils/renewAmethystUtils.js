import { world } from "@minecraft/server";
import { findAllBlocksInVolume, getBlocksInTaxicabDistance } from "./chunkUtils";
import { coordsString, debugMsg } from "./debugUtils";

/**
 * Takes a block location from the dynamic property parser and determines wether the geode formation is valid at that location.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3} blockLoc
 * @returns {boolean|undefined}
 * true = structure valid,
 * false = structure invalid,
 * undefined  = cannot evaluate (unloaded chunks)
 */
export function validGeode(dimension, blockLoc) {
	const inner = "minecraft:calcite";
	const outer = "minecraft:smooth_basalt";
	const center = dimension.getBlock(blockLoc);
	if (
		!center ||
		!dimension.isChunkLoaded(center.location) ||
		!dimension.getBlock(center.location) === "minecraft:water"
	)
		return undefined;
	const innerLayer = getBlocksInTaxicabDistance(dimension, center.location, 1, inner);
	if (innerLayer.length !== 6) return false;
	for (const block of innerLayer) {
		if (block?.typeId === undefined) return undefined;
	}
	const outerLayer = getBlocksInTaxicabDistance(dimension, center.location, 2, outer);
	if (outerLayer.length !== 18) return false;
	for (const block of outerLayer) {
		if (block?.typeId === undefined) return undefined;
	}
	return true;
}

/**
 * Generates a randomized delay for budding amethyst conversion.
 * * The returned value:
 * - Is between 108000 and 144000 ticks (inclusive)
 * - Is always a multiple of the provided step value
 *
 * @param {number} step - Tick step increment(e.g., 20, 100).
 * @returns {number} Randomized delay in ticks.

*/
export function randomBudAmDelay(step = 20) {
	const min = 108000;
	const max = 144000;
	return min + Math.round(Math.random() * ((max - min) / step + 1)) * step;
}

/**
 * Scans an area around a central location for water contained within a valid geode forming structure.
 *
 * @param {import("@minecraft/server").Dimension} dimension - Dimension of area to scan.
 * @param {import("@minecraft/server").Vector3} location - Central location to scan around.
 */
export function scanForCrystallineWater(dimension, location) {
	debugMsg("Running Crystalline Water Search...");
	const waterBlocks = getBlocksInTaxicabDistance(dimension, location, 2, "minecraft:water");
	debugMsg(`Scan Complete`);
	if (!waterBlocks || waterBlocks.length === 0) return;
	debugMsg(`Waterblocks Found`);
	for (const waterBlock of waterBlocks) {
		if (!validGeode(dimension, waterBlock.location)) continue;
		const delay = randomBudAmDelay();
		const propId = `kado:budAmWater-${dimension.id}-${coordsString(waterBlock.location, "id")}`;
		world.setDynamicProperty(propId, delay);
		debugMsg(
			`World Dynamic Property '${propId}' set to world with a value of ${world.getDynamicProperty(
				propId,
			)}.`,
		);
	}
}
