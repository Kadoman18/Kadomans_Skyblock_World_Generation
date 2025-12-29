import { BlockVolume, ItemStack, system, world } from "@minecraft/server";

// --------------------------------------------------
// Coordinate System Reference (Bedrock)
// --------------------------------------------------
// East:  +x (Left)
// West:  -x (Right)
// North: -z (Backwards)
// South: +z (Forwards)

// --------------------------------------------------
// Global Debug Toggle
// --------------------------------------------------
// Enables verbose console output through debugMsg()
const debugging = 0;

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
		// Updates the sculk to all be the correct permutation (sometimes its bugged so this is a backup)
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
 * Logs a debug message if debugging is enabled.
 *
 * @param {string} message - Message to log.
 * @param {number} level - Severity of message, 3 for deep debugging, 2 for light, 1 for regular use, 0 for warnings only.
 */
function debugMsg(message, level) {
	if (level === 0) {
		console.warn(message);
		return;
	}
	if (debugging >= level) console.log(message);
}

/**
 * Converts a Vector3 into a readable string.
 *
 * @param {{x:number, y:number, z:number}} coords - Coordinates to stringify.
 * @param {boolean} debug - True for labeled output, false for command-friendly output.
 * @returns {string} Formatted string.
 */
function coordsString(coords, debug) {
	if (debug) return `X: ${coords.x}, Y: ${coords.y}, Z: ${coords.z}`;
	return `${coords.x} ${coords.y} ${coords.z}`;
}

/**
 * Applies an offset vector to an origin vector.
 *
 * @param {{x:number, y:number, z:number}} origin - Base coordinates.
 * @param {{x:number, y:number, z:number}} offsets - Offset to apply.
 * @returns {{x:number, y:number, z:number}} New coordinates.
 */
function calculateOffsets(origin, offsets) {
	return {
		x: origin.x + offsets.x,
		y: origin.y + offsets.y,
		z: origin.z + offsets.z,
	};
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
	retries = 15,
	interval = 20
) {
	let attempts = 0;

	const handle = system.runInterval(() => {
		if (dimension.isChunkLoaded(location)) {
			system.clearRun(handle);
			debugMsg(`Chunk loaded at ${coordsString(location, true)}`, 1);
			onReady();
			return;
		}

		attempts++;
		debugMsg(
			`Waiting for chunk load (${attempts}/${retries}) at ${coordsString(
				location,
				true
			)}`,
			2
		);

		if (attempts >= retries) {
			system.clearRun(handle);
			debugMsg(
				`Chunk load at ${coordsString(
					location,
					true
				)} Failed after ${retries} attempts.`,
				0
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
		debugMsg(`Failed to resolve dimension for island: ${island.name}`, 0);
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
		2
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
	debugMsg(`Ticking area "${name}" removed`, 2);
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
			3
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
		3
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
		1
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
			3
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
 * @param {object} island - Island with loot.
 * @param {Vector3} originPoint - World origin reference.
 */
function fillChest(island, originPoint) {
	const dimension = island.dimension;
	const chestBlock = dimension.getBlock(
		calculateOffsets(
			calculateOffsets(originPoint, island.origin_offset),
			island.loot.chestLoc
		)
	);

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
			Loot Chest found and filled at location: ${coordsString(
				calculateOffsets(
					calculateOffsets(originPoint, island.origin_offset),
					island.loot.chestLoc
				),
				true
			)}`,
			2
		);
	} else {
		debugMsg(
			`${island.name} Loot Chest not found at location: ${coordsString(
				calculateOffsets(
					calculateOffsets(originPoint, island.origin_offset),
					island.loot.chestLoc
				),
				true
			)}`,
			0
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
 * Generates an island including ticking area, blocks, and loot.
 *
 * @param {object} island - Island definition.
 * @param {Vector3} originPoint - World reference.
 */
function generateIsland(island, originPoint) {
	if (!prepareIsland(island)) return;

	const islandOrigin = calculateOffsets(originPoint, island.origin_offset);
	const tickName = `${island.name.replace(/\s+/g, "_").toLowerCase()}`;

	createTickingArea(island.dimension, islandOrigin, tickName);

	waitForChunkLoaded(island.dimension, islandOrigin, () => {
		buildIslandBlocks(island, originPoint);
		finalizeIslandLoot(island, originPoint);
		debugMsg(`${island.name} generation complete.`, 1);

		system.runTimeout(() => {
			removeTickingArea(island.dimension, tickName);
		}, 20);
	});
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
		debugMsg(`${player.name} Suspended.`, 3);
	}, 5);

	system.runTimeout(() => {
		system.clearRun(suspend);
	}, ticks);
}

// --------------------------------------------------
// World Initialization Hook
// --------------------------------------------------
world.afterEvents.playerSpawn.subscribe((eventData) => {
	const { player } = eventData;

	if (world.getDynamicProperty("kado:overworld_unlocked")) {
		debugMsg(`This world has already been initialized`, 3);
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
		1
	);
	suspendPlayer(player, { x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 });

	for (const island of overworldIslands) generateIsland(island, spawn);

	world.setDynamicProperty("kado:overworld_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:overworld_unlocked" - ${world.getDynamicProperty(
			"kado:overworld_unlocked"
		)}`,
		3
	);
});

// --------------------------------------------------
// Nether Initialization Hook
// --------------------------------------------------
world.afterEvents.playerDimensionChange.subscribe((eventData) => {
	const { player, toDimension, toLocation } = eventData;

	if (toDimension.id === "minecraft:overworld") {
		debugMsg(`This world's overworld has already been initialized`, 3);
		return;
	} else if (
		toDimension.id === "minecraft:nether" &&
		world.getDynamicProperty("kado:nether_unlocked")
	) {
		debugMsg(`This world's nether has already been initialized`, 3);
		return;
	} else if (toDimension.id === "minecraft:the_end") return;

	const origin = { x: toLocation.x, y: toLocation.y + 5, z: toLocation.z };
	debugMsg(
		`Origin Found: ${coordsString(origin, true)}\n${
			player.name
		} awaiting island generation.`,
		1
	);

	for (const island of netherIslands) generateIsland(island, origin);

	world.setDynamicProperty("kado:nether_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:nether_unlocked" - ${world.getDynamicProperty(
			"kado:nether_unlocked"
		)}`,
		3
	);
});
