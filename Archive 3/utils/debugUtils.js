import { VectorXZ } from "@minecraft/server";

// --------------------------------------------------
// Global Debug Toggle
// --------------------------------------------------
// Enables verbose console output through debugMsg()
const debugging = true;

/**
 * Logs a debug message if the messages value is less than or equal to the debugLevel global value.
 *
 * @param {string} message - Message to log.
 * @param {boolean} error - Displays a console warning, true if error, else false.
 */
export function debugMsg(message, error = false) {
	error ? console.warn(message) : debugging && console.log(message);
}

/**
 * Converts a Vector3 into a readable string.
 *
 * @param {Vector3} coords - Coordinates to stringify.
 * @param {string} type - debug(default): prints with coords labeled, command: prints numbers only with spaces,
 * noSpace: prints numbers one after another, no spaces, id: prints coords in parentheses with colon separators.
 * @returns {string} Formatted string.
 */
export function coordsString(coords, type = "debug") {
	switch (type) {
		case "debug":
			return `(X: ${coords.x}, Y: ${coords.y}, Z: ${coords.z})`;
		case "command":
			return `${coords.x} ${coords.y} ${coords.z}`;
		case "noSpace":
			return `${coords.x}${coords.y}${coords.z}`;
		case "id":
			return `(${coords.x}:${coords.y}:${coords.z})`;
		default:
			return `Invalid type provided for coordsString Function.`;
	}
}

/**
 * Converts a Chunk location into a readable string.
 *
 * @param {VectorXZ} chunk - Chunk to stringify.
 * @returns {string} Formatted string.
 */
export function chunksString(chunk) {
	return `(X: ${chunk.x}, Z: ${chunk.z})`;
}

/**
 * Converts Minecraft ticks to real-world hours, minutes, and seconds.
 *
 * @param {number} ticks - Number of game ticks.
 * @returns {object} {hours, minutes, seconds}
 */
export function ticksToTime(ticks) {
	const totalSeconds = Math.floor(ticks / 20);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return { hours, minutes, seconds };
}
