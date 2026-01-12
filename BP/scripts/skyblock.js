import { BlockVolume, ItemStack, system, world } from "@minecraft/server";

// --------------------------------------------------
// Coordinate System Reference (Bedrock)
// --------------------------------------------------
//
// Origin: Lower North West Corner
//
// North: >>>>>>>>> (-z) - (Backwards)
// Northeast: > (+x, -z) - (Back-Left)
// East: >>>>>>>>>> (+x) - (Left)
// Southeast >> (+x, +z) - (Front-Left)
// South: >>>>>>>>> (+z) - (Forwards)
// Southwest: > (-x, +z) - (Front-Right)
// West: >>>>>>>>>> (-x) - (Right)
// Northwest: > (-x, -z) - (Back-Right)

// --------------------------------------------------
// Global Debug Toggle
// --------------------------------------------------
// Enables verbose console output through debugMsg()
const debugging = false;

// Island schema overview:
//
// {
//     name: string,
//     dimension?: Dimension,           // Assigned at runtime
//     origin_offset: Vector3,          // Offset from world spawn
//     loot?: {
//         chestLoc: Vector3,            // Offset from island origin
//         items: {
//             [key]: {
//                 slot: number,
//                 item: string,
//                 amount: number
//             }
//         }
//     },
//     blocks: {
//         [key]: {
//             block: string,
//             perms?: {
//                 perm: string,
//                 value: any
//             },
//             offset: {
//                 from: Vector3,
//                 to: Vector3
//             }
//         }
//     }
// }
//
// NOTES:
// - All offsets are relative to island.origin_offset
// - from/to order does not matter; BlockVolume normalizes bounds
//
//
//
// --------------------------------------------------
// Starter Island Definition
// --------------------------------------------------
const starterIsland = {
	name: "Starter Island",
	targetDimension: "overworld",
	origin_offset: { x: 0, y: 0, z: 0 },

	loot: {
		chestLoc: { x: 0, y: 0, z: 4 },
		items: {
			ice: { slot: 11, item: "minecraft:ice", amount: 1 },
			lava: { slot: 15, item: "minecraft:lava_bucket", amount: 1 },
		},
	},

	blocks: {
		leaves1: {
			block: "minecraft:oak_leaves",
			offset: { from: { x: -3, y: 6, z: -1 }, to: { x: -5, y: 6, z: -1 } },
		},
		leaves2: {
			block: "minecraft:oak_leaves",
			offset: { from: { x: -4, y: 6, z: 0 }, to: { x: -4, y: 6, z: -2 } },
		},
		leaves3: {
			block: "minecraft:oak_leaves",
			offset: { from: { x: -3, y: 5, z: 0 }, to: { x: -5, y: 5, z: -2 } },
		},
		leaves4: {
			block: "minecraft:oak_leaves",
			offset: { from: { x: -2, y: 4, z: 1 }, to: { x: -6, y: 4, z: -3 } },
		},
		leaves5: {
			block: "minecraft:oak_leaves",
			offset: { from: { x: -2, y: 3, z: 0 }, to: { x: -6, y: 3, z: -2 } },
		},
		leaves6: {
			block: "minecraft:oak_leaves",
			offset: { from: { x: -3, y: 3, z: 1 }, to: { x: -5, y: 3, z: -3 } },
		},
		logs: {
			block: "minecraft:oak_log",
			offset: { from: { x: -4, y: 5, z: -1 }, to: { x: -4, y: 0, z: -1 } },
		},
		chest: {
			block: "minecraft:chest",
			perms: { perm: "minecraft:cardinal_direction", value: "north" },
			offset: { from: { x: 0, y: 0, z: 4 }, to: { x: 0, y: 0, z: 4 } },
		},
		grass1: {
			block: "minecraft:grass",
			offset: { from: { x: 1, y: -1, z: 4 }, to: { x: -1, y: -1, z: -1 } },
		},
		grass2: {
			block: "minecraft:grass",
			offset: { from: { x: -2, y: -1, z: 1 }, to: { x: -4, y: -1, z: -1 } },
		},
		dirt1: {
			block: "minecraft:dirt",
			offset: { from: { x: 1, y: -2, z: 4 }, to: { x: -1, y: -3, z: -1 } },
		},
		dirt2: {
			block: "minecraft:dirt",
			offset: { from: { x: -2, y: -2, z: 1 }, to: { x: -4, y: -3, z: -1 } },
		},
		bedrock: {
			block: "minecraft:bedrock",
			offset: { from: { x: 0, y: -3, z: 0 }, to: { x: 0, y: -3, z: 0 } },
		},
	},
};

// --------------------------------------------------
// Sand Island Definition
// --------------------------------------------------
const sandIsland = {
	name: "Sand Island",
	targetDimension: "overworld",
	origin_offset: { x: 0, y: 0, z: -67 },

	loot: {
		chestLoc: { x: 0, y: 0, z: 0 },
		items: {
			sugarcane: { slot: 9, item: "minecraft:sugar_cane", amount: 1 },
			pumpkin: { slot: 11, item: "minecraft:pumpkin_seeds", amount: 1 },
			obsidian: { slot: 13, item: "minecraft:obsidian", amount: 10 },
			melon_seeds: { slot: 15, item: "minecraft:melon_slice", amount: 1 },
			turtle_eggs: { slot: 17, item: "minecraft:turtle_egg", amount: 2 },
		},
	},

	blocks: {
		chest: {
			block: "minecraft:chest",
			perms: { perm: "minecraft:cardinal_direction", value: "south" },
			offset: { from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: 0 } },
		},
		sand: {
			block: "minecraft:sand",
			offset: { from: { x: -1, y: -1, z: -1 }, to: { x: 1, y: -3, z: 1 } },
		},
		sculk: {
			block: "minecraft:sculk_vein",
			perms: { perm: "multi_face_direction_bits", value: 2 },
			offset: { from: { x: -2, y: -4, z: -2 }, to: { x: 2, y: -4, z: 2 } },
		},
		cactus: {
			block: "minecraft:cactus",
			offset: { from: { x: -1, y: 0, z: -1 }, to: { x: -1, y: 0, z: -1 } },
		},
		cactus_flower: {
			block: "minecraft:cactus_flower",
			offset: { from: { x: -1, y: 1, z: -1 }, to: { x: -1, y: 1, z: -1 } },
		},
		// Updates all sculk to be the correct permutation (sometimes its bugged so this is a backup)
		update1: {
			block: "minecraft:sculk_vein",
			perms: { perm: "multi_face_direction_bits", value: 2 },
			offset: { from: { x: -2, y: -5, z: -2 }, to: { x: 2, y: -5, z: 2 } },
		},
		update2: {
			block: "minecraft:air",
			offset: { from: { x: -2, y: -5, z: -2 }, to: { x: 2, y: -5, z: 2 } },
		},
	},
};

// --------------------------------------------------
// Nether Island Definition
// --------------------------------------------------
const netherIsland = {
	name: "Nether Island",
	targetDimension: "nether",
	origin_offset: { x: 0, y: 0, z: 0 },

	blocks: {
		warped_nylium: {
			block: "minecraft:warped_nylium",
			offset: { from: { x: -2, y: -1, z: 2 }, to: { x: -1, y: -1, z: -1 } },
		},
		soul_sand1: {
			block: "minecraft:soul_sand",
			offset: { from: { x: -1, y: -1, z: 2 }, to: { x: -1, y: -1, z: 2 } },
		},
		nether_wart1: {
			block: "minecraft:nether_wart",
			offset: { from: { x: -1, y: 0, z: 2 }, to: { x: -1, y: 0, z: 2 } },
		},
		crimson_nylium: {
			block: "minecraft:crimson_nylium",
			offset: { from: { x: 1, y: -1, z: 2 }, to: { x: 2, y: -1, z: -1 } },
		},
		soul_sand2: {
			block: "minecraft:soul_sand",
			offset: { from: { x: 1, y: -1, z: -1 }, to: { x: 1, y: -1, z: -1 } },
		},
		nether_wart2: {
			block: "minecraft:nether_wart",
			offset: { from: { x: 1, y: 0, z: -1 }, to: { x: 1, y: 0, z: -1 } },
		},
		netherrack: {
			block: "minecraft:netherrack",
			offset: { from: { x: -2, y: -2, z: 2 }, to: { x: 2, y: -3, z: -1 } },
		},
	},
};

// --------------------------------------------------
// Island Registries
// --------------------------------------------------
const overworldIslands = [starterIsland, sandIsland];
const netherIslands = [netherIsland];

// --------------------------------------------------
// Utility Functions
// --------------------------------------------------

/**
 * Logs a debug message if the messages value is less than or equal to the debugLevel global value.
 *
 * @param {string} message - Message to log.
 * @param {boolean} error - Displays a console warning, true if error, else false.
 *
 * Note:
 * Level 3 - least important,
 * Level 2 - slightly relevant,
 * Level 1 - good to know,
 * Level 0 - warnings only
 */
function debugMsg(message, error) {
	if (error) {
		console.warn(message);
		return;
	}
	if (debugging) console.log(message);
}

/**
 * Converts a Vector3 into a readable string.
 *
 * @param {Vector3} coords - Coordinates to stringify.
 * @param {boolean} forDebug - True for labeled output, false for command-friendly output.
 * @returns {string} Formatted string.
 */
function coordsString(coords, forDebug) {
	if (forDebug) return `X: ${coords.x}, Y: ${coords.y}, Z: ${coords.z}`;
	return `${coords.x} ${coords.y} ${coords.z}`;
}

/**
 * Applies an offset vector to an origin vector.
 *
 * @param {Vector3} origin - Base coordinates.
 * @param {Vector3} offsets - Offset to apply.
 * @returns {Vector3} New coordinates.
 */
function calculateOffsets(origin, offsets) {
	return {
		x: origin.x + offsets.x,
		y: origin.y + offsets.y,
		z: origin.z + offsets.z,
	};
}

/**
 * Converts Minecraft ticks to real-world hours, minutes, and seconds.
 *
 * @param {number} ticks - Number of game ticks.
 * @returns {object} {hours, minutes, seconds}
 */
function ticksToTime(ticks) {
	const totalSeconds = Math.floor(ticks / 20);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return { hours, minutes, seconds };
}

// --------------------------------------------------
// Wait for Chunk Loaded
// --------------------------------------------------

/**
 * Waits until a chunk is loaded before calling a callback.
 *
 * @param {Dimension} dimension - Target dimension.
 * @param {Vector3} location - Position to check.
 * @param {Function} onReady - Callback once loaded.
 * @param {number} retries - Max attempts.
 * @param {number} interval - Ticks between checks.
 */
function waitForChunkLoaded(
	dimension,
	location,
	onReady,
	retries = 50,
	interval = 20
) {
	let attempts = 0;

	const handle = system.runInterval(() => {
		if (dimension.isChunkLoaded(location)) {
			system.clearRun(handle);
			debugMsg(`Chunk loaded at ${coordsString(location, true)}`, false);
			onReady();
			return;
		}

		attempts++;
		debugMsg(
			`Waiting for chunk load (${attempts}/${retries}) at ${coordsString(
				location,
				true
			)}`,
			false
		);

		if (attempts >= retries) {
			system.clearRun(handle);
			debugMsg(
				`Chunk load at ${coordsString(
					location,
					true
				)} Failed after ${retries} attempts.`,
				true
			);
		}
	}, interval);
}

// --------------------------------------------------
// Island Build Functions
// --------------------------------------------------

/**
 * Resolves the dimension object for an island.
 *
 * @param {object} island - Island object with targetDimension.
 * @returns {boolean} True if successful, false if failed.
 */
function prepareIsland(island) {
	try {
		island.dimension = world.getDimension(island.targetDimension);
		return true;
	} catch (e) {
		debugMsg(`Failed to resolve dimension for island: ${island.name}`, true);
		return false;
	}
}

/**
 * Creates a temporary ticking area around the island.
 *
 * @param {Dimension} dimension - Target dimension.
 * @param {Vector3} location - Center of ticking area.
 * @param {string} name - Ticking area name.
 */
function createTickingArea(dimension, location, name) {
	dimension.runCommand(
		`tickingarea add circle ${coordsString(location, false)} 2 ${name}`
	);
	debugMsg(
		`Ticking area "${name}" created at ${coordsString(location, true)}`,
		false
	);
}

/**
 * Removes a ticking area by name.
 *
 * @param {Dimension} dimension - Target dimension.
 * @param {string} name - Ticking area name.
 */
function removeTickingArea(dimension, name) {
	dimension.runCommand(`tickingarea remove ${name}`);
	debugMsg(`Ticking area "${name}" removed`, false);
}

/**
 * Applies block permutations efficiently.
 *
 * @param {object} iteration - Block definition with perms.
 * @param {Vector3} from - Volume start.
 * @param {Vector3} to - Volume end.
 * @param {Dimension} dimension - Target dimension.
 */
function applyBlockPermutations(iteration, from, to, dimension) {
	const permId = iteration.perms.perm;
	const permValue = iteration.perms.value;

	// Single-block optimization avoids unnecessary triple loops and prevents edge cases with unloaded neighbors
	const singleBlock =
		from.x === to.x && from.y === to.y && from.z === to.z ? from : null;

	if (singleBlock) {
		const block = dimension.getBlock(singleBlock);
		if (!block) return;

		block.setPermutation(block.permutation.withState(permId, permValue));
		debugMsg(
			`Set permutation ${permId}=${permValue} at ${coordsString(
				from,
				true
			)}`,
			false
		);
		return;
	}

	for (let x = from.x; x <= to.x; x++) {
		for (let y = from.y; y <= to.y; y++) {
			for (let z = from.z; z <= to.z; z++) {
				const block = dimension.getBlock({ x, y, z });
				if (!block) continue;
				block.setPermutation(
					block.permutation.withState(permId, permValue)
				);
			}
		}
	}
	debugMsg(
		`Set permutation ${permId}=${permValue} for volume ${coordsString(
			from,
			true
		)} -> ${coordsString(to, true)}`,
		false
	);
}

/**
 * Builds all blocks of an island.
 *
 * @param {object} island - Island object.
 * @param {Vector3} originPoint - World origin reference.
 */
function buildIslandBlocks(island, originPoint) {
	const dimension = island.dimension;
	const islandOrigin = calculateOffsets(originPoint, island.origin_offset);

	debugMsg(
		`${island.name} origin resolved at ${coordsString(
			islandOrigin,
			true
		)}\nBuilding Island Now...`,
		false
	);

	for (const key in island.blocks) {
		const iteration = island.blocks[key];

		const from = calculateOffsets(islandOrigin, iteration.offset.from);
		const to = calculateOffsets(islandOrigin, iteration.offset.to);

		debugMsg(
			`Building "${key}" from ${coordsString(from, true)} to ${coordsString(
				to,
				true
			)}`,
			false
		);

		const volume = new BlockVolume(from, to);
		dimension.fillBlocks(volume, iteration.block);

		if (iteration.perms)
			applyBlockPermutations(iteration, from, to, dimension);
	}
}

/**
 * Locates a chest on an island and fills it with loot.
 *
 * @param {object} island - Island object with loot.
 * @param {Vector3} originPoint - World origin reference.
 */
function fillChest(island, originPoint) {
	const dimension = island.dimension;
	const chestLoc = calculateOffsets(
		calculateOffsets(originPoint, island.origin_offset),
		island.loot.chestLoc
	);
	const chestBlock = dimension.getBlock(chestLoc);

	if (chestBlock?.typeId === "minecraft:chest") {
		const chestEntity = chestBlock.getComponent("minecraft:inventory");
		if (!chestEntity) return;

		const lootTable = island.loot.items;

		system.run(() => {
			for (let loot in lootTable) {
				const iteration = lootTable[loot];
				chestEntity.container.setItem(
					iteration.slot,
					new ItemStack(iteration.item, iteration.amount)
				);
			}
		});

		debugMsg(
			`${island.name}
			Loot Chest found and filled at location: ${coordsString(chestLoc, true)}`,
			false
		);
	} else {
		debugMsg(
			`${island.name} Loot Chest not found at location: ${coordsString(
				chestLoc,
				true
			)}`,
			true
		);
	}
}

/**
 * Fills chest with loot if defined.
 *
 * @param {object} island - Island object with loot.
 * @param {Vector3} originPoint - World origin reference.
 */
function finalizeIslandLoot(island, originPoint) {
	if (!island.loot) return;
	fillChest(island, originPoint);
}

/**
 * Suspends a player in the air for island generation.
 *
 * @param {Player} player - Player to suspend.
 * @param {Vector3} location - Location to teleport repeatedly.
 * @param {number} ticks - Duration in ticks.
 */
function suspendPlayer(player, location, ticks = 40) {
	const suspend = system.runInterval(() => {
		player.tryTeleport(location);
		debugMsg(`${player.name} Suspended.`, false);
	}, 5);

	system.runTimeout(() => {
		system.clearRun(suspend);
	}, ticks);
}

/**
 * Generates an island including ticking area, blocks, and loot.
 *
 * @param {object} island - Island object.
 * @param {Vector3} originPoint - World origin reference.
 */
function generateIsland(island, originPoint) {
	if (!prepareIsland(island)) return;

	const islandOrigin = calculateOffsets(originPoint, island.origin_offset);
	const tickName = `${island.name.replace(/\s+/g, "_").toLowerCase()}`;

	createTickingArea(island.dimension, islandOrigin, tickName);

	waitForChunkLoaded(island.dimension, islandOrigin, () => {
		buildIslandBlocks(island, originPoint);
		finalizeIslandLoot(island, originPoint);
		debugMsg(`${island.name} generation complete.`, false);

		system.runTimeout(() => {
			removeTickingArea(island.dimension, tickName);
		}, 20);
	});
}

// --------------------------------------------------
// After Player Spawn Hook for World Initialization
// --------------------------------------------------
world.afterEvents.playerSpawn.subscribe((eventData) => {
	const { player } = eventData;

	if (world.getDynamicProperty("kado:overworld_unlocked")) {
		debugMsg(`This world's overworld has already been initialized`, false);
		return;
	}

	const spawn = {
		x: world.getDefaultSpawnLocation().x,
		y: 65,
		z: world.getDefaultSpawnLocation().z,
	};
	debugMsg(
		`Spawn Found: ${coordsString(spawn, true)}\n${
			player.name
		} awaiting island generation.`,
		false
	);
	suspendPlayer(player, { x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 });

	// Thanks Lyvvy <3
	for (const island of overworldIslands) generateIsland(island, spawn);

	world.setDynamicProperty("kado:overworld_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:overworld_unlocked" - ${world.getDynamicProperty(
			"kado:overworld_unlocked"
		)}`,
		false
	);
});

// --------------------------------------------------
// After Dimension Change Hook for Nether Initialization
// --------------------------------------------------
world.afterEvents.playerDimensionChange.subscribe((eventData) => {
	const { player, toDimension, toLocation } = eventData;

	if (toDimension.id === "minecraft:overworld") {
		debugMsg(`This world's overworld has already been initialized`, false);
		return;
	} else if (
		toDimension.id === "minecraft:nether" &&
		world.getDynamicProperty("kado:nether_unlocked")
	) {
		debugMsg(`This world's nether has already been initialized`, false);
		return;
	} else if (toDimension.id === "minecraft:the_end") return;

	debugMsg(`toLocation: ${coordsString(toLocation, true)}`, false);
	debugMsg(`player.location: ${coordsString(player.location, true)}`, false);

	const origin = {
		x: toLocation.x,
		y: toLocation.y + 5,
		z: toLocation.z,
	};

	suspendPlayer(
		player,
		{
			x: origin.x + 0.5,
			y: origin.y,
			z: origin.z + 0.99,
		},
		10
	);

	debugMsg(
		`Origin Found: ${coordsString(origin, true)}\n${
			player.name
		} awaiting island generation.`,
		false
	);

	for (const island of netherIslands) generateIsland(island, origin);

	world.setDynamicProperty("kado:nether_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:nether_unlocked" - ${world.getDynamicProperty(
			"kado:nether_unlocked"
		)}`,
		false
	);
});

/**
 * Checks for a valid block formation to form budding amethyst.
 *
 * @param {Dimension} dimension - The dimension of the formation.
 * @param {Vector3} blockLoc - Center block location (surrounded block which should be water).
 * @returns {boolean} True if surrounded on all sides, both layers.
 */
function validGeode(dimension, blockLoc) {
	const inner = "minecraft:calcite";
	const outer = "minecraft:smooth_basalt";
	return (
		// Inner
		dimension.getBlock(blockLoc).above().typeId === inner &&
		dimension.getBlock(blockLoc).north().typeId === inner &&
		dimension.getBlock(blockLoc).east().typeId === inner &&
		dimension.getBlock(blockLoc).south().typeId === inner &&
		dimension.getBlock(blockLoc).west().typeId === inner &&
		dimension.getBlock(blockLoc).below().typeId === inner &&
		// Outer
		dimension.getBlock(blockLoc).above(2).typeId === outer &&
		dimension.getBlock(blockLoc).above().north().typeId === outer &&
		dimension.getBlock(blockLoc).above().east().typeId === outer &&
		dimension.getBlock(blockLoc).above().south().typeId === outer &&
		dimension.getBlock(blockLoc).above().west().typeId === outer &&
		dimension.getBlock(blockLoc).north(2).typeId === outer &&
		dimension.getBlock(blockLoc).north().east().typeId === outer &&
		dimension.getBlock(blockLoc).east(2).typeId === outer &&
		dimension.getBlock(blockLoc).east().south().typeId === outer &&
		dimension.getBlock(blockLoc).south(2).typeId === outer &&
		dimension.getBlock(blockLoc).south().west().typeId === outer &&
		dimension.getBlock(blockLoc).west(2).typeId === outer &&
		dimension.getBlock(blockLoc).west().north().typeId === outer &&
		dimension.getBlock(blockLoc).below(2).typeId === outer &&
		dimension.getBlock(blockLoc).below().north().typeId === outer &&
		dimension.getBlock(blockLoc).below().east().typeId === outer &&
		dimension.getBlock(blockLoc).below().south().typeId === outer &&
		dimension.getBlock(blockLoc).below().west().typeId === outer
	);
}

// --------------------------------------------------
// After Item Stop Use Hook for Renewable Budding Amethyst
// --------------------------------------------------
world.afterEvents.itemStopUseOn.subscribe((eventData) => {
	const { source: player, itemStack } = eventData;
	if (itemStack?.typeId !== "minecraft:water_bucket") return;
	const rayBlock = player.getBlockFromViewDirection({
		includeLiquidBlocks: true,
		maxDistance: 8,
	});
	const placedWaterBlock =
		rayBlock.block.typeId === "minecraft:water" ? rayBlock.block : null;
	const delay = Math.floor(Math.random() * 36001) + 108000;
	const { hours, minutes, seconds } = ticksToTime(delay);
	debugMsg(
		`Delay: ${delay} ticks\nHours: ${hours}\nMinutes: ${minutes}\nSeconds: ${seconds}`,
		false
	);
	system.runTimeout(() => {
		const preSurrounded = validGeode(
			player.dimension,
			placedWaterBlock.location
		);
		debugMsg(`Surrounded: ${preSurrounded}`, false);
	}, 150);
	system.runTimeout(() => {
		const surrounded = validGeode(
			player.dimension,
			placedWaterBlock.location
		);
		if (
			surrounded &&
			player.dimension.getBlock(placedWaterBlock.location).typeId ===
				"minecraft:water"
		) {
			debugMsg(
				`Water at ${coordsString(
					placedWaterBlock,
					true
				)} was surrounded and converted to budding amethyst.`,
				false
			);
			createTickingArea(
				player.dimension,
				placedWaterBlock.location,
				"amethyst"
			);
			waitForChunkLoaded(player.dimension, placedWaterBlock.location, () => {
				player.dimension.setBlockType(
					placedWaterBlock.location,
					"minecraft:budding_amethyst"
				);
				debugMsg(
					`Water at Location:\n${coordsString(
						placedWaterBlock.location,
						true
					)}\n was surrounded and converted.`,
					false
				);
				system.runTimeout(() => {
					removeTickingArea(player.dimension, "amethyst");
				}, 20);
			});
		} else {
			debugMsg(
				`Water at ${coordsString(
					placedWaterBlock,
					true
				)} was not surrounded.`,
				false
			);
		}
	}, delay);
});

// --------------------------------------------------
// Before Player Break Block Hook for:
// Silk Touch Budding Amethyst
// Renewable Spore Blossoms
// --------------------------------------------------
world.beforeEvents.playerBreakBlock.subscribe((eventData) => {
	const { player, block, itemStack } = eventData;
	if (
		player.getGameMode() !== "Survival" ||
		itemStack?.typeId === "minecraft:shears"
	)
		return;

	let doSpawn = null;

	const enchantable = itemStack?.getComponent("minecraft:enchantable");

	const hasSilkTouch = enchantable?.hasEnchantment("minecraft:silk_touch");
	const hasFortune = enchantable?.hasEnchantment("minecraft:fortune");

	// ------------------------------------------
	// Fortune level (0–3)
	// ------------------------------------------
	let fortuneLevel = 0;

	if (hasFortune) {
		const fortune = enchantable.getEnchantment("minecraft:fortune");
		fortuneLevel = Math.min(fortune?.level ?? 0, 3);
	}

	// ------------------------------------------
	// Flowering azalea (Fortune-scaled)
	// ------------------------------------------
	if (block.typeId === "minecraft:azalea_leaves_flowered" && !hasSilkTouch) {
		const dropChance = 0.01 * (1 + fortuneLevel);
		const dropRoll = Math.random();
		debugMsg(`Chance: ${dropChance}\nRoll: ${dropRoll}`, false);

		if (dropRoll < dropChance) {
			doSpawn = "minecraft:spore_blossom";
			debugMsg(`Spore Blossom Dropped`, false);
		}
	}

	// ------------------------------------------
	// Budding amethyst (Silk Touch only)
	// ------------------------------------------
	if (
		!doSpawn &&
		block.typeId === "minecraft:budding_amethyst" &&
		itemStack &&
		hasSilkTouch
	) {
		const isValidPickaxe =
			itemStack.typeId === "minecraft:copper_pickaxe" ||
			itemStack.typeId === "minecraft:iron_pickaxe" ||
			itemStack.typeId === "minecraft:diamond_pickaxe" ||
			itemStack.typeId === "minecraft:netherite_pickaxe";

		if (isValidPickaxe) {
			doSpawn = "minecraft:budding_amethyst";
			debugMsg(`Budding Amethyst Dropped`, false);
		}
	}

	if (!doSpawn) return;

	const dropBlock = new ItemStack(doSpawn, 1);

	system.run(() => {
		player.dimension.spawnItem(dropBlock, {
			x: block.location.x + 0.5,
			y: block.location.y + 0.5,
			z: block.location.z + 0.5,
		});
	});
});

// --------------------------------------------------
// After Item Use Hook for Renewable Deepslate
// --------------------------------------------------
world.afterEvents.itemUse.subscribe((eventData) => {
	const { source, itemStack } = eventData;

	if (
		source.typeId !== "minecraft:player" ||
		itemStack.typeId !== "minecraft:splash_potion" ||
		itemStack.localizationKey !== "%potion.thick.splash.name"
	)
		return;

	source.addTag("kado:threwThickPotion");

	debugMsg(`${source.name} threw a Thick Splash Potion`, false);
});

// --------------------------------------------------
// After Entity Spawn Hook for Renewable Deepslate
// --------------------------------------------------
world.afterEvents.entitySpawn.subscribe((eventData) => {
	const entity = eventData.entity;

	if (entity.typeId !== "minecraft:splash_potion") return;

	const source = entity.getComponent("minecraft:projectile")?.owner;

	if (
		source?.typeId !== "minecraft:player" ||
		!source?.hasTag("kado:threwThickPotion")
	)
		return;

	entity.addTag("kado:isThickPotion");

	debugMsg(`Marked splash potion ${entity.id} as Thick Potion`, false);
});

// --------------------------------------------------
// After Projectile Hit Block Hook for Renewable Deepslate
// --------------------------------------------------
world.afterEvents.projectileHitBlock.subscribe((eventData) => {
	const { dimension, hitVector, location, projectile, source } = eventData;

	if (
		projectile.typeId !== "minecraft:splash_potion" ||
		!source.hasTag("kado:threwThickPotion")
	)
		return;

	source.removeTag("kado:threwThickPotion");

	let face;

	// Determine impact face from hitVector dominance.
	// This allows accurate placement offset even when
	// Bedrock returns ambiguous projectile collision data.
	const absX = Math.abs(hitVector.x);
	const absY = Math.abs(hitVector.y);
	const absZ = Math.abs(hitVector.z);

	if (absX > absY && absX > absZ) {
		face = hitVector.x > 0 ? "west" : "east";
	} else if (absY > absX && absY > absZ) {
		face = hitVector.y > 0 ? "down" : "up";
	} else {
		face = hitVector.z > 0 ? "north" : "south";
	}

	debugMsg(
		`Potion hit face: "${face}" at ${coordsString(location, true)}`,
		false
	);

	let effectCenter;

	switch (face) {
		case "north": {
			effectCenter = {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) - 0.5,
			};
			break;
		}
		case "west": {
			effectCenter = {
				x: Math.floor(location.x) - 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) + 0.5,
			};
			break;
		}
		case "down": {
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

	debugMsg(
		`Effect location calculated to ${coordsString(effectCenter, true)}.`,
		false
	);

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
		}
	);

	const blockHits = dimension.getBlocks(blockHitsVol, {
		includeTypes: ["minecraft:stone"],
	});

	dimension.fillBlocks(blockHits, "minecraft:deepslate");
});

/**
 * Returns a random integer between min and max (inclusive).
 *
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @param {boolean} floor - Floor the random value.
 * @returns {number} Random integer in range.
 */
function randomNum(min, max) {
	return Math.random() * (max - min) + min;
}

/**
 * Rolls a probability check.
 *
 * @param {number} chance - Value between 0.0 and 1.0.
 * @returns {boolean} True if roll succeeds.
 */
function rollChance(chance) {
	return Math.random() < chance;
}

/**
 * Sequentially ejects generated vault loot items.
 *
 * Behavior:
 * - Opens vault shutter
 * - Ejects one item per second
 * - Returns vault to ACTIVE state after completion
 *
 * @param {Dimension} dimension
 * @param {Block} block
 * @param {Array<{typeId:string,amount:number}>} lootRoll
 */
function dispenseVaultLoot(dimension, block, lootRoll) {
	dimension.playSound("vault.open_shutter", block.location);

	system.runTimeout(() => {
		let iter = 0;
		const permutation = block.permutation;

		const ejecting = system.runInterval(() => {
			if (iter < lootRoll.length) {
				const itemEntity = dimension.spawnItem(
					new ItemStack(lootRoll[iter].typeId, lootRoll[iter].amount),
					{
						x: block.location.x + 0.5,
						y: block.location.y + 1,
						z: block.location.z + 0.5,
					}
				);
				const vel = itemEntity.getVelocity();

				itemEntity.clearVelocity();

				// Apply controlled vault ejection
				itemEntity.applyImpulse({
					x: randomNum(-0.033, 0.033),
					y: 0.25,
					z: randomNum(-0.033, 0.033),
				});

				dimension.playSound("vault.eject_item", block.location);
				iter++;
				return;
			}

			system.clearRun(ejecting);
			block.setPermutation(
				permutation.withState("kado:vault_state", "active")
			);
			dimension.playSound("vault.deactivate", block.location);
		}, 20);
	}, 10);
}

// --------------------------------------------------
// Before Startup Hook Component Registry for Reusable Custom Vaults
// --------------------------------------------------
system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent("kado:trial_vault", {
		onTick(eventData) {
			const { block, dimension } = eventData;
			const activationDist = 3.5;

			const vaultId = `kado:vault-${block.permutation.getState(
				"kado:vault_type"
			)}-(${coordsString(block.location, true)})`;

			const blockCenter = {
				x: block.location.x + 0.5,
				y: block.location.y + 0.5,
				z: block.location.z + 0.5,
			};

			const particleLoc = {
				x: block.location.x + randomNum(0.1, 0.9),
				y: block.location.y + randomNum(0.1, 0.9),
				z: block.location.z + randomNum(0.1, 0.9),
			};

			dimension.spawnParticle("minecraft:basic_smoke_particle", particleLoc);

			const players = world.getAllPlayers();
			for (const player of players) {
				const cooldown = player?.getDynamicProperty(vaultId);
				if (!cooldown) player.setDynamicProperty(vaultId, 0);
				if (cooldown > 0) {
					const nextCooldown = Math.max(cooldown - 10, 0);
					player.setDynamicProperty(vaultId, nextCooldown);

					if (nextCooldown % 600 === 0) {
						const time = ticksToTime(nextCooldown);
						debugMsg(
							`[${vaultId}] Cooldown: ${time.minutes}m ${time.seconds}s`,
							false
						);
					}

					block.setPermutation(
						block.permutation.withState("kado:vault_state", "inactive")
					);
					return;
				}
			}

			let hasEligiblePlayerNearby = false;

			if (block.permutation.getState("kado:vault_state") === "dispensing")
				return;

			for (const player of dimension.getPlayers()) {
				const xDist = player.location.x - blockCenter.x;
				const yDist = player.location.y - blockCenter.y;
				const zDist = player.location.z - blockCenter.z;

				const inRange =
					xDist ** 2 + yDist ** 2 + zDist ** 2 <= activationDist ** 2;

				if (!inRange) continue;

				const cooldown = player.getDynamicProperty(vaultId) ?? 0;

				if (cooldown === 0) {
					hasEligiblePlayerNearby = true;
					break;
				}
			}

			const newState = hasEligiblePlayerNearby
				? { state: "active", sound: "vault.activate" }
				: { state: "inactive", sound: "vault.deactivate" };

			const particle =
				block.permutation.getState("kado:vault_type") === "normal"
					? "minecraft:basic_flame_particle"
					: "minecraft:blue_flame_particle";

			if (
				block.permutation.getState("kado:vault_state") === "active" ||
				block.permutation.getState("kado:vault_state") === "dispensing"
			) {
				dimension.spawnParticle(particle, particleLoc);
			}

			if (
				block.permutation.getState("kado:vault_state") !== newState.state
			) {
				block.setPermutation(
					block.permutation.withState("kado:vault_state", newState.state)
				);
				dimension.playSound(newState.sound, block.location);
			}
		},

		onPlace(eventData) {
			const { block, dimension } = eventData;
			const permutation = block.permutation;
			const vaultId = `kado:vault-${block.permutation.getState(
				"kado:vault_type"
			)}-(${coordsString(block.location, true)})`;
			const players = world.getAllPlayers();
			for (const player of players) {
				player.setDynamicProperty(vaultId, 0);
			}

			block.setPermutation(
				permutation
					.withState("kado:vault_type", "normal")
					.withState("kado:vault_state", "inactive")
			);
		},

		onPlayerBreak(eventData) {
			const { block, brokenBlockPermutation } = eventData;
			const vaultId = `kado:vault-${brokenBlockPermutation.getState(
				"kado:vault_type"
			)}-(${coordsString(block.location, true)})`;
			const players = world.getAllPlayers();
			for (const player of players) {
				player?.setDynamicProperty(vaultId, undefined);
				debugMsg(
					`${
						player.name
					}s Dynamic Property: ${vaultId}, set to ${player?.setDynamicProperty(
						vaultId,
						undefined
					)} and removed.`,
					false
				);
			}
		},

		onPlayerInteract(eventData) {
			const { dimension, player, block } = eventData;
			const vaultId = `kado:vault-${block.permutation.getState(
				"kado:vault_type"
			)}-(${coordsString(block.location, true)})`;
			const inventory = player.getComponent("minecraft:inventory");
			const mainHand = inventory.container?.getItem(
				player.selectedSlotIndex
			);

			const permutation = block.permutation;
			const vaultType = block.permutation.getState("kado:vault_type");

			if (
				player.getGameMode() === "Creative" &&
				(mainHand?.typeId === undefined ||
					mainHand?.typeId === "kado:vault")
			) {
				const oldVaultId = vaultId;
				block.setPermutation(
					permutation.withState(
						"kado:vault_type",
						block.permutation.getState("kado:vault_type") === "normal"
							? "ominous"
							: "normal"
					)
				);
				debugMsg(
					`Permutation set to ${block.permutation.getState(
						"kado:vault_type"
					)}`,
					false
				);
				player?.setDynamicProperty(oldVaultId, undefined);
				debugMsg(
					`Dynamic Property: ${oldVaultId} set to ${player?.setDynamicProperty(
						oldVaultId
					)} and removed.`,
					false
				);
				player.setDynamicProperty(
					`kado:vault-${block.permutation.getState(
						"kado:vault_type"
					)}-(${coordsString(block.location, true)})`
				);
				debugMsg(
					`New Dynamic Prop Id: kado:vault-${block.permutation.getState(
						"kado:vault_type"
					)}-(${coordsString(block.location, true)})`,
					false
				);
				return;
			}

			if (
				player.getDynamicProperty(vaultId) > 0 ||
				block.permutation.getState("kado:vault_state") !== "active" ||
				player.getGameMode() !== "Survival"
			) {
				dimension.playSound("vault.reject_rewarded_player", block.location);
				return;
			}

			const keyType = mainHand?.typeId;
			const validInterract =
				(keyType === "minecraft:trial_key" && vaultType === "normal") ||
				(keyType === "minecraft:ominous_trial_key" &&
					vaultType === "ominous") ||
				block.permutation.getState("kado:vault_state") === "active"
					? true
					: false;
			if (!validInterract) {
				dimension.playSound("vault.reject_rewarded_player", block.location);
				return;
			}

			if (mainHand.amount > 1) {
				inventory.container.setItem(
					player.selectedSlotIndex,
					new ItemStack(keyType, mainHand.amount - 1)
				);
			} else {
				inventory.container.setItem(player.selectedSlotIndex, undefined);
			}

			dimension.playSound("vault.insert_item", block.location);
			const lootManager = world.getLootTableManager();
			const lootTable =
				vaultType === "normal"
					? lootManager.getLootTable("chests/trial_chambers/reward")
					: lootManager.getLootTable(
							"chests/trial_chambers/reward_ominous"
					  );
			const lootRoll = lootManager.generateLootFromTable(lootTable);
			block.setPermutation(
				permutation.withState("kado:vault_state", "dispensing")
			);
			for (const loot of lootRoll) {
				debugMsg(`Rolled: ${loot.amount} ${loot.typeId}s`, false);
			}
			dispenseVaultLoot(dimension, block, lootRoll);
			system.runTimeout(() => {
				player.setDynamicProperty(vaultId, 6000);
			}, lootRoll.length * 20 + 15);
		},
	});
});

/* VAULT SOUND DEFS

vault.activate

vault.ambient

vault.break

vault.close_shutter

vault.deactivate

vault.eject_item

vault.hit

vault.insert_item

vault.insert_item_fail

vault.open_shutter

vault.place

vault.reject_rewarded_player

vault.step

*/
