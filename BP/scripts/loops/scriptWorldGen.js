import { world } from "@minecraft/server";
import { playerInfoMaps } from "../cache/playersCache";
import {
	convertChunkToCoords,
	hasBiome,
	iterateChunksCircular,
	replaceBlock,
	sameChunkAsLast,
} from "../utils/chunkUtils";

/**@type {Map<string, import("../utils/typedefs").ReplacementConfig>} */
const replaceMap = new Map();

replaceMap.set("minecraft:target", {
	replaceWithBlock: "minecraft:sculk_shrieker",
	biomeFilter: { biomeId: "minecraft:deep_dark", searchLocation: -48 },
	permutation: { id: "can_summon", value: true },
	sound: "power.on.sculk_sensor",
});
replaceMap.set("minecraft:cauldron", {
	replaceWithBlock: "minecraft:cauldron",
	biomeFilter: { biomeId: "minecraft:swampland", searchLocation: { min: 30, max: 80 } },
	permutation: { id: "fill_level", value: 2 },
	summonEntity: {
		id: "minecraft:cat",
		offset: { x: 0.5, y: 0.5, z: 0.5 },
		spawnEvents: ["minecraft:spawn_midnight_cat", "minecraft:spawn_wild_baby"],
	},
});

export function scriptWorldGen(initialized) {
	if (!initialized) return;
	for (const playerInfoMap of playerInfoMaps.values()) {
		const { player, genRadius } = playerInfoMap;
		const { dimension } = player;
		if (!dimension || dimension.id !== "minecraft:overworld") continue;
		const currentChunk = {
			x: Math.floor(player.location.x / 16),
			z: Math.floor(player.location.z / 16),
		};
		if (playerInfoMap.lastChunk && sameChunkAsLast(playerInfoMap.lastChunk, currentChunk)) {
			continue;
		}
		playerInfoMap.lastChunk = currentChunk;
		iterateChunksCircular(currentChunk, genRadius, (chunk) => {
			const key = `kado:chunkLoaded-(${chunk.x}:${chunk.z})`;
			if (
				world.getDynamicProperty(key) ||
				!dimension.isChunkLoaded(convertChunkToCoords(chunk, player.location.y))
			) {
				return;
			}
			let replaced = false;
			for (const [targetId, config] of replaceMap) {
				if (replaced) break;
				if (config.biomeFilter) {
					const range = normalizeSearchRange(config.biomeFilter.searchLocation);
					if (
						!hasBiome(
							dimension,
							convertChunkToCoords(chunk, range.min),
							config.biomeFilter.biomeId,
						)
					) {
						continue;
					}
				}
				replaced = replaceBlock(
					dimension,
					chunk,
					normalizeSearchRange(config.biomeFilter?.searchLocation ?? player.location.y),
					{
						[targetId]: {
							replaceWithBlock: config.replaceWithBlock,
							permutation: config.permutation,
							summonEntity: config.summonEntity,
						},
					},
					() => {
						if (config?.sound) player.playSound(config.sound);
					},
				);
			}
			world.setDynamicProperty(key, true);
		});
	}
}

function normalizeSearchRange(searchLocation) {
	if (typeof searchLocation === "number") {
		return { min: searchLocation, max: searchLocation };
	}
	return searchLocation;
}
