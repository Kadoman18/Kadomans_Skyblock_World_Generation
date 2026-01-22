/**
 * Returns a random floating-point number within a range.
 *
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @param {boolean} inclusive - True for inclusive max, false for exclusive.
 * @param {boolean} whole - True for whole number output, false for floats.
 * @returns {number} Random number between min and max.
 */

export function randomNum(min, max, inclusive = true, whole = false) {
	const val = inclusive
		? Math.random() * (max - min + 1) + min
		: Math.random() * (max - min) + min;
	return whole ? Math.floor(val) : val;
}
/**
 * Applies an offset vector to an origin vector.
 *
 * @param {Vector3} origin - Base coordinates.
 * @param {Vector3} offsets - Offset to apply.
 * @returns {Vector3} New coordinates.
 */

export function calculateOffsets(origin, offsets) {
	return {
		x: origin.x + offsets.x,
		y: origin.y + offsets.y,
		z: origin.z + offsets.z,
	};
}
/**
 * Euclidean distance squared
 * @param {Vector3} vectorA
 * @param {Vector3} vectorB
 */

export function calculateDistance(vectorA, vectorB) {
	const distanceX = vectorA.x - vectorB.x;
	const distanceY = vectorA.y - vectorB.y;
	const distanceZ = vectorA.z - vectorB.z;
	return Math.sqrt(distanceX ** 2 + distanceY ** 2 + distanceZ ** 2);
}
