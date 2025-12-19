import { system, world, BlockVolume, ItemStack } from "@minecraft/server";

// East: +x (Left)
// West: -x (Right)
// North: -z (Backwards)
// South: +z (Forwards)

// Starter Island block definitions and coords
const starterIsland = {
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
		perm: {
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
};

const starterLoot = {
	ice: {
		slot: 11,
		item: "minecraft:ice",
	},
	lava: {
		slot: 15,
		item: "minecraft:lava_bucket",
	},
};

const sandIsland = {
	// Cactus
	chest: {
		block: "minecraft:cactus",
		offset: {
			from: { x: 1, y: 2, z: -68 },
			to: { x: 1, y: 0, z: -68 },
		},
	},
	// Chest
	chest: {
		block: "minecraft:chest",
		perm: {
			perm: "minecraft:cardinal_direction",
			value: "south",
		},
		offset: {
			from: { x: 0, y: 0, z: -67 },
			to: { x: 0, y: 0, z: -67 },
		},
	},
	// Sand
	sand: {
		block: "minecraft:sand",
		offset: {
			from: { x: -1, y: -1, z: -66 },
			to: { x: 1, y: -3, z: -68 },
		},
	},
	// Sculk
	sculk: {
		block: "minecraft:sculk_vein",
		perm: {
			perm: "multi_face_direction_bits",
			value: 2,
		},
		offset: {
			from: { x: -1, y: -4, z: -66 },
			to: { x: 1, y: -4, z: -68 },
		},
	},
};

const sandLoot = {
	ice: {
		slot: 11,
		item: "minecraft:ice",
	},
	lava: {
		slot: 15,
		item: "minecraft:lava_bucket",
	},
};

/*

	TEMP: {
		block: "minecraft:",
		offset: {
			from: { x: , y: , z:  },
			to: { x: , y: , z:  }
		}
	},
*/

// Build Starter Island
function buildIsland(dimension, island, sx, sy, sz) {
	for (let key in island) {
		const iteration = island[key];

		const from = {
			x: sx + iteration.offset.from.x,
			y: sy + iteration.offset.from.y,
			z: sz + iteration.offset.from.z,
		};
		const to = {
			x: sx + iteration.offset.to.x,
			y: sy + iteration.offset.to.y,
			z: sz + iteration.offset.to.z,
		};

		// No block permutations
		if (!iteration.perm) {
			const volume = new BlockVolume(from, to);
			dimension.fillBlocks(volume, iteration.block);
			continue;
		}

		// Block permutation specification
		const permId = iteration.perm.perm;
		const permValue = iteration.perm.value;

		for (let x = from.x; x <= to.x; x++) {
			for (let y = from.y; y <= to.y; y++) {
				for (let z = from.z; z <= to.z; z++) {
					const block = dimension.getBlock({ x, y, z });
					if (!block) continue;
					const blockPerm = block.permutation.withState(permId, permValue);
					block.setPermutation(blockPerm);
				}
			}
		}
	}
}

function fillChest(dimension, location, offset, lootTable) {
	const chestBlock = dimension.getBlock({
		x: location.x + offset.x,
		y: location.y + offset.y,
		z: location.z + offset.z,
	});

	if (chestBlock && chestBlock.typeId === "minecraft:chest") {
		const chestEntity = chestBlock.getComponent("minecraft:inventory");
		if (chestEntity) {
			system.run(() => {
				for (let key in lootTable) {
					const iteration = lootTable[key];
					chestEntity.container.setItem(
						iteration.slot,
						new ItemStack(iteration.item, 1)
					);
				}
			});
		}
	}
}

const setup_id = system.runInterval(() => {
	const overworld = world.getDimension("overworld");
	const spawn = { x: 0, y: 65, z: 0 };

	// Teleport player to 0, 65, 0 and set worldspawn
	overworld.runCommand(
		`tp ${player.name} ${spawn.x} ${spawn.y + 1} ${spawn.z}`
	);
	overworld.runCommand(`setworldspawn ${spawn.x} ${spawn.y} ${spawn.z}`);

	// Build the starter island
	system.runTimeout(() => {
		buildIsland(overworld, starterIsland, spawn.x, spawn.y, spawn.z);
	}, 5);

	// Fill chest after generation
	const starterChest = { x: 0, y: 0, z: 4 };
	system.runTimeout(() => {
		fillChest(overworld, spawn, starterChest, starterLoot);
	}, 5);

	// Build the sand island
	system.runTimeout(() => {
		buildIsland(overworld, sandIsland, spawn.x, spawn.y, spawn.z);
	}, 5);

	// Fill sand island chest
	const sandChest = { x: 0, y: 0, z: -67 };
	system.runTimeout(() => {
		fillChest(overworld, spawn, sandChest, sandLoot);
	}, 5);
}, 20);

world.beforeEvents.playerBreakBlock.subscribe(() => {
	system.clearRun(setup_id);
});

world.afterEvents.playerDimensionChange.subscribe((eventData) => {
	const { player, fromDimension, toDimension } = eventData;
});
