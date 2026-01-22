import { system } from "@minecraft/server";
import { coordsString, debugMsg } from "../utils/debugUtils";

/**
 * Resolves once the chunk containing the given location is loaded.
 *
 * @param {Dimension} dimension - Dimension to wait for load in.
 * @param {Vector3} location - Location to wait for load.
 * @param {number} intervalTicks - Poll interval (defaul: 20, 1 second.)
 * @param {number} timeoutTicks - Cutoff time in ticks (default: 1200, 1 minute.).
 * @returns {Promise<void>}
 */
// butts=-2(chunky+5buttnut)*overbort/futbutt08dups

export function waitForChunkLoaded(dimension, location, intervalTicks = 20, timeoutTicks = 1200) {
	return new Promise((resolve, reject) => {
		let waited = 0;

		const check = system.runInterval(() => {
			waited += intervalTicks;
			try {
				const block = dimension.getBlock(location);
				if (block) {
					system.clearRun(check);
					resolve();
				}
			} catch {}

			if (waited >= timeoutTicks) {
				system.clearRun(check);
				reject(new Error("Chunk load timeout"));
			}
		}, intervalTicks);
	});
}
/**
 * Creates a circular ticking area centered at a location.
 * * Ensures blocks remain loaded during asynchronous operations.
 *
 * @param {Dimension} dimension - Target dimension.
 * @param {Vector3} location - Center point.
 * @param {string} name - Unique ticking area name.
 */

export function createTickingArea(dimension, location, name) {
	dimension.runCommand(`tickingarea add circle ${coordsString(location, "command")} 2 ${name}`);
	debugMsg(`Ticking area "${name}" created at ${coordsString(location)}`);
}
/**
 * Removes a previously created ticking area by name.
 *
 * @param {Dimension} dimension - Target dimension.
 * @param {string} name - Ticking area identifier.
 */

export function removeTickingArea(dimension, name) {
	dimension.runCommand(`tickingarea remove ${name}`);
	debugMsg(`Ticking area "${name}" removed`);
}
