import { system, world, BlockVolume } from "@minecraft/server";

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
		block: "minecraft:chest[facing=north]",
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
function applyPlatform(dimension, island, sx, sy, sz) {
	for (const key in island) {
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

		const volume = new BlockVolume(from, to);
		dimension.fillBlocks(volume, iteration.block);
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
			for (key in lootTable) {
				const iteration = lootTable[key];
				chestEntity.container.setItem(
					iteration.slot,
					new ItemStack(iteration.item, 1)
				);
			}
		}
	}
}

// Main Loop
const setup_id = system.runInterval(() => {
	const overworld = world.getDimension("overworld");

	let spawn = world.getDefaultSpawnLocation();
	const spawnX = Math.floor(spawn.x);
	const spawnY = 65;
	const spawnZ = Math.floor(spawn.z);
	spawn = { x: spawnX, y: spawnY, z: spawnZ };

	applyPlatform(overworld, starterIsland, spawnX, spawnY, spawnZ);
	// Fill chest after generation
	const chestLoc = { x: 0, y: 0, z: 4 };
	fillChest(overworld, spawn, chestLoc, starterLoot);
}, 20);

// Cancel loop on block break
world.beforeEvents.playerBreakBlock.subscribe(() => {
	system.clearRun(setup_id);
});
