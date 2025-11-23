import { system, world, BlockVolume } from "@minecraft/server";

// Starter Island block definitions and coords
const platform = {
	grass_top: {
		fill: "minecraft:grass",
		offset: {
			from: { x: -3, y: 0, z: -3 },
			to: { x: 3, y: 0, z: 3 },
		},
	},
	tree: {
		fill: "minecraft:oak_sapling",
		offset: {
			from: { x: spawnX, y: spawnY + 1, z: spawnZ },
			to: { x: spawnX, y: spawnY + 1, z: spawnZ },
		},
	},
	crimson_nylium: {
		fill: "minecraft:crimson_nylium",
		offset: {
			from: { x: -2, y: 0, z: 0 },
			to: { x: -2, y: 0, z: 0 },
		},
	},
	warped_nylium: {
		fill: "minecraft:warped_nylium",
		offset: {
			from: { x: 2, y: 0, z: 0 },
			to: { x: 2, y: 0, z: 0 },
		},
	},
	dirt: {
		fill: "minecraft:dirt",
		offset: {
			from: { x: -3, y: -2, z: -3 },
			to: { x: 3, y: -1, z: 3 },
		},
	},
	bedrock: {
		fill: "minecraft:bedrock",
		offset: {
			from: { x: 0, y: -2, z: 0 },
			to: { x: 0, y: -2, z: 0 },
		},
	},
};

// Build Starter Island
function applyPlatform(overworld, sx, sy, sz) {
	for (const key in platform) {
		const iteration = platform[key];

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
		overworld.fillBlocks(volume, iteration.fill);
	}
}

// Main Loop
const setup_id = system.runInterval(() => {
	const overworld = world.getDimension("overworld");

	const spawn = world.getDefaultSpawnLocation();
	const spawnX = Math.floor(spawn.x);
	const spawnY = 64;
	const spawnZ = Math.floor(spawn.z);

	applyPlatform(overworld, spawnX, spawnY, spawnZ);
}, 20);

// Cancel loop on block break
world.beforeEvents.playerBreakBlock.subscribe(() => {
	system.clearRun(setup_id);
});
