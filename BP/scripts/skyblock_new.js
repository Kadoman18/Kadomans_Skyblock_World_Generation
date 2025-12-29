import { system, world, BlockVolume, ItemStack } from "@minecraft/server";

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
const debugging = true;

// Island schema overview:
//
// {
//     name: string,
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
	origin_offset: { x: 0, y: 0, z: 0 },

	loot: {
		chestLoc: { x: 0, y: 0, z: 4 },
		items: {
			ice: {
				slot: 11,
				item: "minecraft:ice",
				amount: 1,
			},
			lava: {
				slot: 15,
				item: "minecraft:lava_bucket",
				amount: 1,
			},
		},
	},

	blocks: {
		// --------------------------
		// Tree (Leaves)
		// --------------------------
		leaves1: {
			block: "minecraft:oak_leaves",
			offset: {
				from: { x: -3, y: 6, z: -1 },
				to: { x: -5, y: 6, z: -1 },
			},
		},
		leaves2: {
			block: "minecraft:oak_leaves",
			offset: {
				from: { x: -4, y: 6, z: 0 },
				to: { x: -4, y: 6, z: -2 },
			},
		},
		leaves3: {
			block: "minecraft:oak_leaves",
			offset: {
				from: { x: -3, y: 5, z: 0 },
				to: { x: -5, y: 5, z: -2 },
			},
		},
		leaves4: {
			block: "minecraft:oak_leaves",
			offset: {
				from: { x: -2, y: 4, z: 1 },
				to: { x: -6, y: 4, z: -3 },
			},
		},
		leaves5: {
			block: "minecraft:oak_leaves",
			offset: {
				from: { x: -2, y: 3, z: 0 },
				to: { x: -6, y: 3, z: -2 },
			},
		},
		leaves6: {
			block: "minecraft:oak_leaves",
			offset: {
				from: { x: -3, y: 3, z: 1 },
				to: { x: -5, y: 3, z: -3 },
			},
		},

		// --------------------------
		// Tree (Logs)
		// --------------------------
		logs: {
			block: "minecraft:oak_log",
			offset: {
				from: { x: -4, y: 5, z: -1 },
				to: { x: -4, y: 0, z: -1 },
			},
		},

		// --------------------------
		// Chest
		// --------------------------
		chest: {
			block: "minecraft:chest",
			perms: {
				perm: "minecraft:cardinal_direction",
				value: "north",
			},
			offset: {
				from: { x: 0, y: 0, z: 4 },
				to: { x: 0, y: 0, z: 4 },
			},
		},

		// --------------------------
		// Terrain
		// --------------------------
		grass1: {
			block: "minecraft:grass",
			offset: {
				from: { x: 1, y: -1, z: 4 },
				to: { x: -1, y: -1, z: -1 },
			},
		},
		grass2: {
			block: "minecraft:grass",
			offset: {
				from: { x: -2, y: -1, z: 1 },
				to: { x: -4, y: -1, z: -1 },
			},
		},
		dirt1: {
			block: "minecraft:dirt",
			offset: {
				from: { x: 1, y: -2, z: 4 },
				to: { x: -1, y: -3, z: -1 },
			},
		},
		dirt2: {
			block: "minecraft:dirt",
			offset: {
				from: { x: -2, y: -2, z: 1 },
				to: { x: -4, y: -3, z: -1 },
			},
		},

		// Anchor block preventing void fall
		bedrock: {
			block: "minecraft:bedrock",
			offset: {
				from: { x: 0, y: -3, z: 0 },
				to: { x: 0, y: -3, z: 0 },
			},
		},
	},
};

// --------------------------------------------------
// Sand Island Definition
// --------------------------------------------------
const sandIsland = {
	name: "Sand Island",
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
			perms: {
				perm: "minecraft:cardinal_direction",
				value: "south",
			},
			offset: {
				from: { x: 0, y: 0, z: 0 },
				to: { x: 0, y: 0, z: 0 },
			},
		},

		sand: {
			block: "minecraft:sand",
			offset: {
				from: { x: -1, y: -1, z: 1 },
				to: { x: 1, y: -3, z: -11 },
			},
		},

		sculk: {
			block: "minecraft:sculk_vein",
			perms: {
				perm: "multi_face_direction_bits",
				value: 2,
			},
			offset: {
				from: { x: -1, y: -4, z: 1 },
				to: { x: 1, y: -4, z: -1 },
			},
		},

		cactus: {
			block: "minecraft:cactus",
			offset: {
				from: { x: -1, y: 0, z: -1 },
				to: { x: -1, y: 0, z: -1 },
			},
		},

		cactus_flower: {
			block: "minecraft:cactus_flower",
			offset: {
				from: { x: -1, y: 1, z: -1 },
				to: { x: -1, y: 1, z: -1 },
			},
		},
	},
};

// --------------------------------------------------
// Island Registry
// --------------------------------------------------
const overworldIslands = [starterIsland, sandIsland];

/**
 * Outputs a message to the console when debugging is enabled.
 *
 * @param {string} message
 *        The message to log to the console.
 *
 * @returns {void}
 */
function debugMsg(message) {
	if (!debugging) return;
	console.log(message);
}

/**
 * Converts a Vector3 into a readable string format.
 *
 * @param {{ x: number, y: number, z: number }} coords
 *        The coordinates to stringify.
 *
 * @param {boolean} debug
 *        True for labeled debug output, false for command-safe format.
 *
 * @returns {string}
 *        The formatted coordinate string.
 */
function coordsString(coords, debug) {
	if (debug) {
		return `X: ${coords.x}, Y: ${coords.y}, Z: ${coords.z}`;
	} else {
		return `${coords.x} ${coords.y} ${coords.z}`;
	}
}

/**
 * Applies an offset vector to an origin vector.
 *
 * @param {{ x: number, y: number, z: number }} origin
 *        The base position.
 *
 * @param {{ x: number, y: number, z: number }} offsets
 *        The offset to apply.
 *
 * @returns {{ x: number, y: number, z: number }}
 *        The resulting combined position.
 */
function calculateOffsets(origin, offsets) {
	return {
		x: origin.x + offsets.x,
		y: origin.y + offsets.y,
		z: origin.z + offsets.z,
	};
}

/**
 * Repeatedly teleports the player to a fixed location.
 *
 * Prevents falling or interaction during island generation.
 *
 * @param {{ x: number, y: number, z: number }} location
 *        Location to keep the player suspended at.
 *
 * @param {number} ticks
 *        Duration in ticks.
 *
 * @returns {void}
 */
function suspendPlayer(location, ticks) {
	const suspend = system.runInterval(() => {
		player.tryTeleport(location);
	}, 5);

	system.runTimeout(() => {
		system.clearRun(suspend);
		debugMsg(`Island generation complete.`);
	}, ticks);
}

/**
 * Creates a temporary ticking area around an island.
 *
 * @param {object} island
 *        Island definition with origin_offset and dimension.
 *
 * @param {number} duration
 *        Duration in ticks for the ticking area.
 *
 * @returns {void}
 */
function tick(island, duration) {
	const dimension = island.dimension;
	const location = calculateOffsets(spawn, island.origin_offset);

	dimension.runCommand(
		`tickingarea add circle ${coordsString(location, false)} 2`
	);
	debugMsg(`Ticking area created at\n${coordsString(location, true)}`);

	system.runTimeout(() => {
		dimension.runCommand(
			`tickingarea remove ${coordsString(location, false)}`
		);
		debugMsg(`Ticking area removed at\n${coordsString(location, true)}`);
	}, duration);
}

/**
 * Builds an island from its block definitions.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 *        Target dimension.
 *
 * @param {{ x: number, y: number, z: number }} originPoint
 *        World reference point.
 *
 * @param {object} island
 *        Island configuration object.
 *
 * @param {number} afterTicks
 *        Delay before execution.
 *
 * @returns {void}
 */
function buildIsland(dimension, originPoint, island, afterTicks) {
	system.runTimeout(() => {
		const islandOrigin = calculateOffsets(originPoint, island.origin_offset);

		debugMsg(
			`${island.name} origin located at ${coordsString(islandOrigin, true)}`
		);

		for (let block in island.blocks) {
			const iteration = island.blocks[block];

			const from = {
				x: islandOrigin.x + iteration.offset.from.x,
				y: islandOrigin.y + iteration.offset.from.y,
				z: islandOrigin.z + iteration.offset.from.z,
			};
			const to = {
				x: islandOrigin.x + iteration.offset.to.x,
				y: islandOrigin.y + iteration.offset.to.y,
				z: islandOrigin.z + iteration.offset.to.z,
			};

			debugMsg(
				`Current Build Iteration: ${block}\n${coordsString(
					from,
					true
				)}\n${coordsString(to, true)}`
			);

			const volume = new BlockVolume(from, to);
			dimension.fillBlocks(volume, iteration.block);

			if (iteration.perms) {
				setBlockPerms(iteration, from, to, dimension);
			}
		}

		if (island.loot) {
			fillChest(dimension, island, originPoint);
		}
	}, afterTicks);
}

/**
 * Applies block permutations to a volume.
 *
 * @param {object} iteration
 *        Block definition containing permutation data.
 *
 * @param {{ x: number, y: number, z: number }} from
 *        Minimum volume corner.
 *
 * @param {{ x: number, y: number, z: number }} to
 *        Maximum volume corner.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 *        Target dimension.
 *
 * @returns {void}
 */
function setBlockPerms(iteration, from, to, dimension) {
	const permId = iteration.perms.perm;
	const permValue = iteration.perms.value;

	for (let x = from.x; x <= to.x; x++) {
		for (let y = from.y; y <= to.y; y++) {
			for (let z = from.z; z <= to.z; z++) {
				const block = dimension.getBlock({ x, y, z });
				if (!block) continue;

				const blockPerm = block.permutation.withState(permId, permValue);
				block.setPermutation(blockPerm);

				debugMsg(
					`Set permutation ${permValue} for block at location: ${coordsString(
						{ x, y, z },
						true
					)}`
				);
			}
		}
	}
}

/**
 * Locates and fills an island chest with loot.
 *
 * @param {import("@minecraft/server").Dimension} dimension
 *        Dimension containing the chest.
 *
 * @param {object} island
 *        Island definition containing loot.
 *
 * @param {{ x: number, y: number, z: number }} originPoint
 *        World reference position.
 *
 * @returns {void}
 */
function fillChest(dimension, island, originPoint) {
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
			`Chest found and filled at location: ${coordsString(
				calculateOffsets(
					calculateOffsets(originPoint, island.origin_offset),
					island.loot.chestLoc
				),
				true
			)}`
		);
	} else {
		debugMsg(
			`Chest not found at location: ${coordsString(
				calculateOffsets(
					calculateOffsets(originPoint, island.origin_offset),
					island.loot.chestLoc
				),
				true
			)}`
		);
	}
}

// --------------------------------------------------
// World Initialization Hook
// --------------------------------------------------
world.afterEvents.playerSpawn.subscribe((eventData) => {
	const { player } = eventData;

	if (world.getDynamicProperty("kado:overworld_unlocked")) {
		debugMsg(`This world has already been initialized`);
		return;
	}

	const overworld = world.getDimension("overworld");

	const spawn = {
		x: world.getDefaultSpawnLocation().x,
		y: 65,
		z: world.getDefaultSpawnLocation().z,
	};

	debugMsg(`Spawn Found: ${coordsString(spawn, true)}`);
	debugMsg(`${player.name} awaiting island generation.`);

	suspendPlayer(
		{ x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 },
		60 * overworldIslands.length
	);

	for (const island of overworldIslands) {
		island.dimension = overworld;
		tick(island, 120);
		buildIsland(overworld, spawn, island, 100);
	}

	world.setDynamicProperty("kado:overworld_unlocked", true);

	debugMsg(
		`Dynamic Property: "kado:overworld_unlocked" - ${world.getDynamicProperty(
			"kado:overworld_unlocked"
		)}`
	);
});
