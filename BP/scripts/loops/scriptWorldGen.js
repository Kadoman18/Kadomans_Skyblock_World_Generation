import { system, world } from "@minecraft/server";
import { playerInfoMaps } from "../cache/playersCache";
import {
	convertChunkToCoords,
	hasBiome,
	iterateChunksCircular,
	normalizeSearchRange,
	replaceBlockInChunk,
	sameChunkAsLast,
} from "../utils/chunkUtils";

/**@type {Map<string, import("../utils/typedefs").ReplacementConfig>} */
const replaceMap = new Map();

replaceMap.set("minecraft:target", {
	replaceWithBlock: "minecraft:sculk_shrieker",
	biomeFilter: { biomeId: "minecraft:deep_dark", bounds: -48 },
	permutations: [{ id: "can_summon", value: true }],
	sound: "power.on.sculk_sensor",
});
replaceMap.set("minecraft:cauldron", {
	replaceWithBlock: "minecraft:cauldron",
	biomeFilter: { biomeId: "minecraft:swampland", bounds: { min: 30, max: 80 } },
	permutations: [
		{ id: "fill_level", value: 2 },
		{ id: "cauldron_liquid", value: "water" },
	],
	summonEntity: {
		id: "minecraft:cat",
		offset: { x: 0.5, y: 0.5, z: 0.5 },
		spawnEvents: ["minecraft:spawn_midnight_cat", "minecraft:spawn_wild_baby"],
	},
});

/**
 * Handles per-player, chunk-based world generation logic for the overworld.
 *
 * This function tracks each player's current chunk and, when the player enters
 * a new chunk or has been in an unmarked chunk for more than a second, iterates outward
 * in a circular radius to process nearby chunks.
 * Each chunk is processed at most once (persisted via a dynamic world property).
 *
 * For each eligible chunk:
 * - Ensures the chunk is loaded
 * - Optionally filters by biome
 * - Attempts block replacement based on entries in {@link replaceMap}
 * - Triggers optional side effects (sounds, entity summons, permutations)
 *
 * @param {boolean} initialized - Whether world generation has completed initialization. If false, the function exits immediately.
 * @returns {void}
 */
export function scriptWorldGen(initialized) {
	if (!initialized) return;
	for (const playerInfoMap of playerInfoMaps.values()) {
		const { player, genRadius } = playerInfoMap;
		const { dimension } = player;
		const nowTick = system.currentTick;
		if (!dimension || dimension.id !== "minecraft:overworld") continue;
		const currentChunk = {
			x: Math.floor(player.location.x / 16),
			z: Math.floor(player.location.z / 16),
		};
		if (
			playerInfoMap.lastChunk &&
			sameChunkAsLast(playerInfoMap.lastChunk, currentChunk) &&
			playerInfoMap.lastChunkCheckTick !== undefined &&
			nowTick - playerInfoMap.lastChunkCheckTick < 20
		) {
			continue;
		}
		playerInfoMap.lastChunk = currentChunk;
		playerInfoMap.lastChunkCheckTick = nowTick;
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
					const range = normalizeSearchRange(config.biomeFilter.bounds);
					if (!hasBiome(dimension, chunk, config.biomeFilter.biomeId, range)) {
						continue;
					}
				}
				replaced = replaceBlockInChunk(
					dimension,
					chunk,
					normalizeSearchRange(config.biomeFilter?.bounds ?? player.location.y),
					{
						[targetId]: {
							replaceWithBlock: config.replaceWithBlock,
							permutations: config.permutations,
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
