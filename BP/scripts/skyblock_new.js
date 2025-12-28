import { system, world, BlockVolume, ItemStack } from "@minecraft/server";

// East: +x (Left)
// West: -x (Right)
// North: -z (Backwards)
// South: +z (Forwards)

const debugging = true;

// Starter Island variables
const starterIsland = {
	origin_offset: { x: 0, y: 0, z: 0 },
	loot: {
		chestLoc: { x: 0, y: 0, z: 4 },
		items: {
			ice: {
				slot: 11,
				item: "minecraft:ice",
			},
			lava: {
				slot: 15,
				item: "minecraft:lava_bucket",
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
	origin_offset: { x: 0, y: 1, z: -67 },
	loot: {
		chestLoc: { x: 0, y: -1, z: 0 },
		items: {
			pumpkin: {
				slot: 11,
				item: "minecraft:pumpkin",
			},
			sugarcane: {
				slot: 14,
				item: "minecraft:reeds",
			},
			melon_seeds: {
				slot: 17,
				item: "minecraft:melon_seeds",
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
				from: { x: 0, y: -1, z: 0 },
				to: { x: 0, y: -1, z: 0 },
			},
		},
		// Sand
		sand: {
			block: "minecraft:sand",
			offset: {
				from: { x: -1, y: -2, z: 1 },
				to: { x: 1, y: -4, z: -11 },
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
				from: { x: -1, y: -5, z: 1 },
				to: { x: 1, y: -5, z: -1 },
			},
		},
		// Cactus
		cactus: {
			block: "minecraft:cactus",
			offset: {
				from: { x: 1, y: 2, z: -1 },
				to: { x: 1, y: 0, z: -1 },
			},
		},
	},
};

const islands = [sandIsland, starterIsland];

world.afterEvents.playerSpawn.subscribe((eventData) => {
	const { player, initialSpawn } = eventData;
	if (!initialSpawn || world.getDynamicProperty("kado:overworld_unlocked"))
		return;
	const overworld = world.getDimension("overworld");
	const spawn = {
		x: world.getDefaultSpawnLocation().x,
		y: 65,
		z: world.getDefaultSpawnLocation().z,
	};

	if (debugging) {
		console.log(`Spawn Found: X: ${spawn.x}, Y: ${spawn.y}, Z: ${spawn.z}`);
	}

	function calculateOffsets(spawn, offsets) {
		return {
			x: spawn.x + offsets.x,
			y: spawn.y + offsets.y,
			z: spawn.z + offsets.z,
		};
	}

	function teleportPlayers(player, island) {
		const location = calculateOffsets(spawn, island.origin_offset);
		if (player.tryTeleport(location)) {
			if (debugging) {
				console.log(
					`Teleported ${player.name} Succeeded.\nX: ${location.x}, Y: ${location.y}, Z: ${location.z}`
				);
			} else {
				console.log(
					`Teleport ${player.name} failed\nX: ${location.x}, Y: ${location.y}, Z: ${location.z}`
				);
			}
		}
	}

	// Build Starter Island
	function buildIsland(dimension, island) {
		const origin = calculateOffsets(spawn, island.origin_offset);

		if (debugging) {
			console.log(
				`${island.name} origin located at X: ${origin.x}, Y: ${origin.y}, Z: ${origin.z}`
			);
		}

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

			if (debugging) {
				console.log(
					`Current Build Iteration: ${block}\nx: ${from.x}, y: ${from.y}, z: ${from.z}\nx: ${to.x}, y: ${to.y}, z: ${to.z}`
				);
			}

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
					if (debugging) {
						console.log(
							`Set permutation ${permValue} for block at location: X:${x} , Y:${y} , Z: ${z}`
						);
					}
				}
			}
		}
	}

	function fillChest(dimension, island) {
		const chestBlock = dimension.getBlock(
			calculateOffsets(spawn, island.loot.chestLoc)
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
						new ItemStack(iteration.item, 1)
					);
				}
			});
			if (debugging) {
				console.log(
					`Chest found and filled at location: X:${island.loot.chestLoc.x} , Y:${island.loot.chestLoc.y} , Z: ${island.loot.chestLoc.z}`
				);
			}
			return true;
		} else {
			if (debugging) {
				console.log(
					`Chest not found at location: X:${island.loot.chestLoc.x} , Y:${island.loot.chestLoc.y} , Z: ${island.loot.chestLoc.z}`
				);
			}
			return false;
		}
	}

	for (const island of islands) {
		teleportPlayers(player, island);
		system.runTimeout(() => {
			buildIsland(overworld, island);
		}, 20);
	}

	world.setDynamicProperty("kado:overworld_unlocked", true);
	if (debugging) {
		console.log(
			`Dynamic Property: "kado:overworld_unlocked" - ${world.getDynamicProperty(
				"kado:overworld_unlocked"
			)}`
		);
	}
});
