import { system, world } from "@minecraft/server";

const setup_id = system.runInterval(() => {
	const overworld = world.getDimension("overworld");
	const spawn = world.getDefaultSpawnLocation();
	const sx = Math.floor(spawn.x);
	const sy = 64;
	const sz = Math.floor(spawn.z);

	overworld.runCommand(
		`fill ${sx - 3} ${sy} ${sz - 3} ${sx + 3} ${sy} ${
			sz + 3
		} grass replace air`
	);
	overworld.runCommand(`setblock ${sx} ${sy + 1} ${sz} oak_sapling`);
	overworld.runCommand(
		`fill ${sx - 3} ${sy - 1} ${sz - 3} ${sx + 3} ${sy - 2} ${
			sz + 3
		} dirt replace air`
	);
	overworld.runCommand(`setblock ${sx} ${sy - 2} ${sz} bedrock`);
	overworld.runCommand(
		`fill ${sx - 2} ${sy} ${sz} ${
			sx - 2
		} ${sy} ${sz} crimson_nylium replace grass`
	);
	overworld.runCommand(
		`fill ${sx + 2} ${sy} ${sz} ${
			sx + 2
		} ${sy} ${sz} warped_nylium replace grass`
	);
}, 20);

world.beforeEvents.playerBreakBlock.subscribe(() => {
	system.clearRun(setup_id);
});
