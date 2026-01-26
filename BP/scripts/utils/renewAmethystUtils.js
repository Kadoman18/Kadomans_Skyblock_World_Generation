/**
 * @returns {boolean|undefined}
 * true  = structure valid
 * false = structure invalid
 * undefined  = cannot evaluate (unloaded chunks)
 */
export function validGeode(dimension, blockLoc) {
	const inner = "minecraft:calcite";
	const outer = "minecraft:smooth_basalt";
	const center = dimension.getBlock(blockLoc);
	if (!center || !dimension.isChunkLoaded(center.location)) return undefined;
	const innerChecks = [
		center.above(),
		center.north(),
		center.east(),
		center.south(),
		center.west(),
		center.below(),
	];
	for (const block of innerChecks) {
		if (block?.typeId === undefined) return undefined;
		if (block?.typeId !== inner) return false;
	}
	const outerChecks = [
		center.above(2),
		center.above().north(),
		center.above().east(),
		center.above().south(),
		center.above().west(),
		center.north(2),
		center.north().east(),
		center.east(2),
		center.east().south(),
		center.south(2),
		center.south().west(),
		center.west(2),
		center.west().north(),
		center.below(2),
		center.below().north(),
		center.below().east(),
		center.below().south(),
		center.below().west(),
	];
	for (const block of outerChecks) {
		if (block?.typeId === undefined) return undefined;
		if (block?.typeId !== outer) return false;
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
