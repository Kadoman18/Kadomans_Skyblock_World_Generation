import { system, world, BlockVolume, ItemStack } from "@minecraft/server";

// East: +x (Left)
// West: -x (Right)
// North: -z (Backwards)
// South: +z (Forwards)

const debugging = true;

world.afterEvents.playerSpawn.subscribe((eventData) => {
	const { player } = eventData;
	if (world.getDynamicProperty("kado:overworld_unlocked")) return;
	const overworld = world.getDimension("overworld");
	const spawn = {
		x: world.getDefaultSpawnLocation().x,
		y: 65,
		z: world.getDefaultSpawnLocation().z,
	};

	// Starter Island variables
	const starterIsland = {
		name: "Starter Island",
		dimension: overworld,
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
			// Tree
			// Leaves
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
			// Logs
			logs: {
				block: "minecraft:oak_log",
				offset: {
					from: { x: -4, y: 5, z: -1 },
					to: { x: -4, y: 0, z: -1 },
				},
			},
			// Chest
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
			// Grass
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
			// Dirt
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
			// Bedrock
			bedrock: {
				block: "minecraft:bedrock",
				offset: {
					from: { x: 0, y: -3, z: 0 },
					to: { x: 0, y: -3, z: 0 },
				},
			},
		},
	};

	// Sand Island variables
	const sandIsland = {
		name: "Sand Island",
		dimension: overworld,
		origin_offset: { x: 0, y: 0, z: -67 },
		loot: {
			chestLoc: { x: 0, y: 0, z: 0 },
			items: {
				sugarcane: {
					slot: 9,
					item: "minecraft:sugar_cane",
					amount: 1,
				},
				pumpkin: {
					slot: 11,
					item: "minecraft:pumpkin_seeds",
					amount: 1,
				},
				obsidian: {
					slot: 13,
					item: "minecraft:obsidian",
					amount: 10,
				},
				melon_seeds: {
					slot: 15,
					item: "minecraft:melon_slice",
					amount: 1,
				},
				turtle_eggs: {
					slot: 17,
					item: "minecraft:turtle_egg",
					amount: 2,
				},
			},
		},
		blocks: {
			// Chest
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
			// Sand
			sand: {
				block: "minecraft:sand",
				offset: {
					from: { x: -1, y: -1, z: 1 },
					to: { x: 1, y: -3, z: -11 },
				},
			},
			// Sculk
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
			// Cactus
			cactus: {
				block: "minecraft:cactus",
				offset: {
					from: { x: -1, y: 0, z: -1 },
					to: { x: -1, y: 0, z: -1 },
				},
			},
			// Cactus Flower
			cactus: {
				block: "minecraft:cactus_flower",
				offset: {
					from: { x: -1, y: 1, z: -1 },
					to: { x: -1, y: 1, z: -1 },
				},
			},
		},
	};

	const islands = [starterIsland, sandIsland];

	function debugMsg(message) {
		if (!debugging) return;
		console.log(message);
	}

	function coordsString(coords, debug) {
		if (debug) {
			return `X: ${coords.x}, Y: ${coords.y}, Z: ${coords.z}`;
		} else {
			return `${coords.x} ${coords.y} ${coords.z}`;
		}
	}

	function calculateOffsets(origin, offsets) {
		return {
			x: origin.x + offsets.x,
			y: origin.y + offsets.y,
			z: origin.z + offsets.z,
		};
	}

	function suspendPlayer(location, ticks) {
		const suspend = system.runInterval(() => {
			player.tryTeleport(location);
		}, 5);

		system.runTimeout(() => {
			system.clearRun(suspend);
			debugMsg(`Island generation complete.`);
		}, ticks);
	}

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

	// Build Starter Island
	function buildIsland(island, afterTicks) {
		system.runTimeout(() => {
			const origin = calculateOffsets(spawn, island.origin_offset);
			const dimension = island.dimension

			debugMsg(
				`${island.name} origin located at ${coordsString(origin, true)}`
			);

			for (let block in island.blocks) {
				const iteration = island.blocks[block];

				const from = {
					x: origin.x + iteration.offset.from.x,
					y: origin.y + iteration.offset.from.y,
					z: origin.z + iteration.offset.from.z,
				};
				const to = {
					x: origin.x + iteration.offset.to.x,
					y: origin.y + iteration.offset.to.y,
					z: origin.z + iteration.offset.to.z,
				};

				debugMsg(
					`Current Build Iteration: ${block}\n${coordsString(
						from,
						true
					)}\n${coordsString(to, true)}`
				);

				// No block permutations
				const volume = new BlockVolume(from, to);
				dimension.fillBlocks(volume, iteration.block);

				// Block permutation specification
				if (iteration.perms) {
					setBlockWithPerms(iteration, from, to, dimension);
				}
			}
			if (island.loot) {
				fillChest(dimension, island);
			}
		}, afterTicks);
	}

	function setBlockWithPerms(iteration, from, to, dimension) {
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
							{
								x: x,
								y: y,
								z: z,
							},
							true
						)}`
					);
				}
			}
		}
	}

	function fillChest(dimension, island) {
		const chestBlock = dimension.getBlock(
			calculateOffsets(
				calculateOffsets(spawn, island.origin_offset),
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
				`Chest found and filled at location: ${calculateOffsets(
				calculateOffsets(spawn, island.origin_offset),
				island.loot.chestLoc
			)}`
			);
		} else {
			debugMsg(
				`Chest not found at location: ${calculateOffsets(
				calculateOffsets(spawn, island.origin_offset),
				island.loot.chestLoc
			)}`
			);
		}
	}

	debugMsg(`Spawn Found: ${coordsString(spawn, true)}`);

	debugMsg(`${player.name} awaiting island generation.`);
	suspendPlayer(
		{ x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 },
		30 * islands.length
	);

	for (const island of islands) {
		tick(island, 120);
		buildIsland(overworld, island, 100);
	}

	world.setDynamicProperty("kado:overworld_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:overworld_unlocked" - ${world.getDynamicProperty(
			"kado:overworld_unlocked"
		)}`
	);
});
