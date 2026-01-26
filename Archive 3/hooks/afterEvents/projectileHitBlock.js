import { world, BlockVolume } from "@minecraft/server";
import { debugMsg, coordsString } from "../../utils/debugUtils";

world.afterEvents.projectileHitBlock.subscribe((eventData) => {
	const { dimension, location, projectile, source, hitVector } = eventData;
	const { face, block, faceLocation } = eventData.getBlockHit();
	if (projectile.typeId !== "minecraft:splash_potion" || !source.hasTag("kado:threwThickPotion"))
		return;
	source.removeTag("kado:threwThickPotion");
	debugMsg(`Potion hit face: "${face}" at ${coordsString(location)}`);
	let effectCenter;
	switch (face) {
		case "North": {
			effectCenter = {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) - 0.5,
			};
			break;
		}
		case "West": {
			effectCenter = {
				x: Math.floor(location.x) - 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) + 0.5,
			};
			break;
		}
		case "Down": {
			effectCenter = {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) - 0.5,
				z: Math.floor(location.z) + 0.5,
			};
			break;
		}
		default: {
			effectCenter = {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) + 0.5,
			};
			break;
		}
	}
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
