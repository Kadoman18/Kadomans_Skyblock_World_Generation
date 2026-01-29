import { world, BlockVolume } from "@minecraft/server";
import { debugMsg, coordsString } from "../../utils/debugUtils";

world.afterEvents.projectileHitBlock.subscribe((eventData) => {
	const { dimension, location, projectile, source, hitVector } = eventData;
	const { face, block, faceLocation } = eventData.getBlockHit();
	if (projectile.typeId !== "minecraft:splash_potion" || !source.hasTag("kado:threwThickPotion"))
		return;
	source.removeTag("kado:threwThickPotion");
	debugMsg(`Potion hit face: "${face}" at ${coordsString(location)}`);
	let effectCenter = getEffectCenter(face, location);
	debugMsg(`Effect location calculated to ${coordsString(effectCenter)}.`);
	const radius = 1.4;
	const blockHitsVol = new BlockVolume(
		{
			x: effectCenter.x + radius,
			y: effectCenter.y + radius,
			z: effectCenter.z + radius,
		},
		{
			x: effectCenter.x - radius,
			y: effectCenter.y - radius,
			z: effectCenter.z - radius,
		},
	);
	const blockHits = dimension.getBlocks(blockHitsVol, {
		includeTypes: ["minecraft:stone"],
	});
	dimension.fillBlocks(blockHits, "minecraft:deepslate");
});
/**
 *
 * @param {string} face - Block face the potion hit.
 * @param {import("@minecraft/server").Vector3} location - Location of block that was hit.
 * @returns {import("@minecraft/server").Vector3}
 */
function getEffectCenter(face, location) {
	switch (face) {
		case "North": {
			return {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) - 0.5,
			};
		}
		case "West": {
			return {
				x: Math.floor(location.x) - 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) + 0.5,
			};
		}
		case "Down": {
			return {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) - 0.5,
				z: Math.floor(location.z) + 0.5,
			};
		}
		default: {
			return {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) + 0.5,
			};
		}
	}
}
