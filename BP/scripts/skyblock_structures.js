import { system, world } from "@minecraft/server";

// East: +x (Left)
// West: -x (Right)
// North: -z (Backwards)
// South: +z (Forwards)

const debugging = true;

world.afterEvents.playerSpawn.subscribe((eventData) => {
	const { player, initialSpawn } = eventData;
	if (!initialSpawn || world.getDynamicProperty("kado:overworld_unlocked"))
		return;
	const overworld = world.getDimension("overworld");
	const spawn = {
		x: world.getDefaultSpawnLocation().x + 0.5,
		y: 65,
		z: world.getDefaultSpawnLocation().z + 0.5,
	};

	debugMsg(`Spawn Found: X: ${spawn.x}, Y: ${spawn.y}, Z: ${spawn.z}`);

	const starterIsland = {
		id: "starterIsland",
		offsets: { x: -6, y: -3, z: -3 },
	};
	const sandIsland = {
		id: "sandIsland",
		offsets: { x: -1, y: -4, z: -68 },
	};

	const islands = [starterIsland, sandIsland];

	function debugMsg(message) {
		if (!debugging) return;
		console.log(message);
	}

	function calculateOffsets(spawn, offsets) {
		return {
			x: spawn.x + offsets.x,
			y: spawn.y + offsets.y,
			z: spawn.z + offsets.z,
		};
	}

	function buildIsland(dimension, island) {
		const location = calculateOffsets(spawn, island.offsets);
		dimension.runCommand(
			`tickingarea add circle ${location.x} ${location.y} ${location.z} 2`
		);
		debugMsg(
			`Ticking area created at\nX: ${location.x}, Y: ${location.y}, Z: ${location.z}`
		);
		system.runTimeout(() => {
			debugMsg(`Creating Island: ${island.id}`);
			dimension.runCommand(
				`structure load ${island.id} ${location.x} ${location.y} ${location.z}`
			);
		}, 50);
		system.runTimeout(() => {
			dimension.runCommand(
				`tickingarea remove ${location.x} ${location.y} ${location.z}`
			);
			debugMsg(
				`Ticking area removed at\nX: ${location.x}, Y: ${location.y}, Z: ${location.z}`
			);
		}, 100);
	}

	debugMsg(`${player.name} awaiting island generation.`);
	const dontFall = system.runInterval(() => {
		player.tryTeleport(spawn);
	}, 5);

	system.runTimeout(() => {
		system.clearRun(dontFall);
		debugMsg(`Island generation complete.`);
	}, 30 * islands.length);

	for (const island of islands) {
		buildIsland(overworld, island);
	}

	world.setDynamicProperty("kado:overworld_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:overworld_unlocked" - ${world.getDynamicProperty(
			"kado:overworld_unlocked"
		)}`
	);
});
