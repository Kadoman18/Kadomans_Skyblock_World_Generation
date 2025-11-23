import {
	system,
	world,
	BlockPermutation,
	ItemStack,
	Vector,
	Direction,
	EntityDamageCause,
} from "@minecraft/server";

const air_permutation = BlockPermutation.resolve("minecraft:air");
const grass_permutation = BlockPermutation.resolve("minecraft:grass");

const check = new Map();
check.set({ x: 1, y: 0, z: 0 }, "minecraft:calcite");
check.set({ x: -1, y: 0, z: 0 }, "minecraft:calcite");
check.set({ x: 0, y: 0, z: 1 }, "minecraft:calcite");
check.set({ x: 0, y: 0, z: -1 }, "minecraft:calcite");
check.set({ x: 2, y: 0, z: 0 }, "minecraft:smooth_basalt");
check.set({ x: -2, y: 0, z: 0 }, "minecraft:smooth_basalt");
check.set({ x: 0, y: 0, z: 2 }, "minecraft:smooth_basalt");
check.set({ x: 0, y: 0, z: -2 }, "minecraft:smooth_basalt");

const setup_id = system.runInterval(() => {
	const overworld = world.getDimension("overworld");
	const spawn = world.getDefaultSpawnLocation();

	overworld.fillBlocks(
		{
			x: spawn.x - 3,
			y: 63,
			z: spawn.z - 3,
		},
		{
			x: spawn.x + 3,
			y: 63,
			z: spawn.z + 3,
		},
		"minecraft:grass",
		{
			matchingBlock: air_permutation,
		}
	);

	if (
		overworld.getBlock({
			x: spawn.x,
			y: 63,
			z: spawn.z,
		}).typeId === "minecraft:grass"
	) {
		overworld.fillBlocks(
			{ x: spawn.x, y: 64, z: spawn.z },
			{ x: spawn.x, y: 64, z: spawn.z },
			"minecraft:sapling",
			{ matchingBlock: air_permutation }
		);
	}

	overworld.fillBlocks(
		{ x: spawn.x - 2, y: 63, z: spawn.z },
		{ x: spawn.x - 2, y: 63, z: spawn.z },
		"minecraft:crimson_nylium",
		{ matchingBlock: grass_permutation }
	);
	overworld.fillBlocks(
		{ x: spawn.x + 2, y: 63, z: spawn.z },
		{ x: spawn.x + 2, y: 63, z: spawn.z },
		"minecraft:warped_nylium",
		{ matchingBlock: grass_permutation }
	);
}, 20);

world.beforeEvents.playerBreakBlock.subscribe(() => {
	system.clearRun(setup_id);
});

system.runInterval(() => {
	for (const player of world.getPlayers()) {
		const view = player.getBlockFromViewDirection({ maxDistance: 8 });
		if (!view) continue;

		const block = view.block;
		if (!block) continue;

		if (block.typeId === "minecraft:coral_fan_dead") {
			const coral_color = block.permutation.getState("coral_color");

			const flowing =
				detectFlowingWater(block, "n") ||
				detectFlowingWater(block, "e") ||
				detectFlowingWater(block, "s") ||
				detectFlowingWater(block, "w");

			if (block.isWaterlogged && coral_color === "red" && flowing) {
				player.dimension.fillBlocks(
					Vector.add(block.location, { x: 0, y: 1, z: 0 }),
					Vector.add(block.location, { x: 0, y: 1, z: 0 }),
					BlockPermutation.resolve("minecraft:sand", {
						sand_type: "red",
					}),
					{ matchingBlock: BlockPermutation.resolve("minecraft:air") }
				);
			} else if (block.isWaterlogged && flowing) {
				world
					.getDimension("overworld")
					.spawnItem(new ItemStack("minecraft:sand"), block.location);
			}

			if (Math.round(Math.random() * 100) % 4 === 0)
				block.setType("minecraft:air");
		}
	}
}, 100);

function detectFlowingWater(block, direction) {
	const overworld = world.getDimension("overworld");
	let loc;

	switch (direction) {
		case "n":
			loc = {
				x: block.location.x,
				y: block.location.y,
				z: block.location.z - 1,
			};
			break;
		case "e":
			loc = {
				x: block.location.x + 1,
				y: block.location.y,
				z: block.location.z,
			};
			break;
		case "s":
			loc = {
				x: block.location.x,
				y: block.location.y,
				z: block.location.z + 1,
			};
			break;
		case "w":
			loc = {
				x: block.location.x - 1,
				y: block.location.y,
				z: block.location.z,
			};
			break;
		default:
			return false;
	}

	const state = overworld.getBlock(loc).permutation.getState("liquid_depth");
	return state !== 0;
}

world.afterEvents.playerInteractWithBlock.subscribe((ev) => {
	const block = ev.block;

	if (
		ev.itemStack.typeId === "minecraft:potion" &&
		block.typeId === "minecraft:stone"
	) {
		block.setType("minecraft:deepslate");

		const player = ev.player;
		const inv = player.getComponent("minecraft:inventory");

		inv.container.setItem(
			player.selectedSlot,
			new ItemStack("minecraft:glass_bottle", 1)
		);
	}
});

world.afterEvents.pistonActivate.subscribe((ev) => {
	if (ev.block.typeId !== "minecraft:piston") return;
	if (ev.block.permutation.getState("facing_direction") !== 0) return;

	const coalLoc = Vector.add(ev.block.location, { x: 0, y: -1, z: 0 });

	const entities = world
		.getDimension("overworld")
		.getEntitiesAtBlockLocation(coalLoc);

	for (const entity of entities) {
		const itemComp = entity.getComponent("minecraft:item");
		if (!itemComp) continue;

		if (
			itemComp.itemStack.typeId === "minecraft:coal" &&
			itemComp.itemStack.amount === 64
		) {
			entity.kill();
			world
				.getDimension("overworld")
				.spawnItem(new ItemStack("minecraft:diamond"), coalLoc);
		}
	}
});

world.afterEvents.playerPlaceBlock.subscribe((ev) => {
	const block = ev.block;

	if (
		block.typeId === "minecraft:sculk_shrieker" &&
		ev.dimension.getBlock(Vector.add(block.location, { x: 0, y: -1, z: 0 }))
			.typeId === "minecraft:soul_sand"
	) {
		block.setPermutation(
			BlockPermutation.resolve("minecraft:sculk_shrieker", {
				can_summon: true,
			})
		);
	}
});

world.afterEvents.entitySpawn.subscribe((ev) => {
	const entity = ev.entity;

	if (entity.typeId !== "minecraft:lightning_bolt") return;

	const base = {
		x: Math.floor(entity.location.x),
		y: Math.floor(entity.location.y),
		z: Math.floor(entity.location.z),
	};

	let glowLoc = null;

	for (let x = -1; x < 2; x++) {
		for (let y = -1; y < 2; y++) {
			for (let z = -1; z < 2; z++) {
				const loc = Vector.add(base, { x, y, z });
				if (
					entity.dimension.getBlock(loc).typeId === "minecraft:glowstone"
				) {
					glowLoc = loc;
				}
			}
		}
	}

	if (!glowLoc) return;

	const checkSide = (off, bits) => {
		const side = entity.dimension.getBlock(Vector.add(glowLoc, off));
		if (side.typeId === "minecraft:vine") {
			side.setPermutation(
				BlockPermutation.resolve("minecraft:glow_lichen", {
					multi_face_direction_bits: bits,
				})
			);
		}
	};

	checkSide({ x: 0, y: 0, z: -1 }, 4);
	checkSide({ x: 1, y: 0, z: 0 }, 8);
	checkSide({ x: 0, y: 0, z: 1 }, 16);
	checkSide({ x: -1, y: 0, z: 0 }, 32);
});

world.afterEvents.entityDie.subscribe((ev) => {
	const e = ev.deadEntity;

	if (
		(e.typeId === "minecraft:bat" || e.typeId === "minecraft:dolphin") &&
		ev.damageSource.cause === EntityDamageCause.sonicBoom
	) {
		e.dimension.spawnItem(new ItemStack("minecraft:echo_shard"), e.location);
	}

	if (e.typeId === "minecraft:ender_dragon") {
		e.dimension.spawnEntity("minecraft:shulker", e.location);
	}

	if (e.typeId === "minecraft:endermite" && e.getEffect("slow_falling")) {
		if (Math.round(Math.random() * 40) % 40 === 0) {
			e.dimension.spawnItem(new ItemStack("minecraft:elytra"), e.location);
		}
	}
});

world.afterEvents.entityHurt.subscribe((ev) => {
	const e = ev.hurtEntity;

	if (
		e.typeId === "minecraft:guardian" &&
		ev.damageSource.cause === "lightning"
	) {
		e.dimension.spawnEntity("minecraft:elder_guardian", e.location);
		e.remove();
	}
});

world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
	if (ev.itemStack.typeId !== "minecraft:amethyst_block") return;

	const player = ev.player;
	const target = ev.target;

	if (target.typeId !== "minecraft:vex") return;

	target.dimension.spawnEntity("minecraft:allay", target.location);
	target.remove();

	const inv = player.getComponent("minecraft:inventory");

	if (ev.itemStack.amount === 1) {
		player.runCommand("clear @s minecraft:amethyst_block 0 1");
	} else {
		inv.container.setItem(
			player.selectedSlot,
			new ItemStack("minecraft:amethyst_block", ev.itemStack.amount - 1)
		);
	}
});

world.beforeEvents.itemUseOn.subscribe((ev) => {
	if (ev.itemStack.typeId !== "minecraft:lava_bucket") return;

	let offset = { x: 0, y: 0, z: 0 };

	switch (ev.blockFace) {
		case Direction.Down:
			offset = { x: 0, y: -1, z: 0 };
			break;
		case Direction.East:
			offset = { x: 1, y: 0, z: 0 };
			break;
		case Direction.North:
			offset = { x: 0, y: 0, z: -1 };
			break;
		case Direction.South:
			offset = { x: 0, y: 0, z: 1 };
			break;
		case Direction.Up:
			offset = { x: 0, y: 1, z: 0 };
			break;
		case Direction.West:
			offset = { x: -1, y: 0, z: 0 };
			break;
	}

	const original = ev.source.dimension.getBlock(
		Vector.add(ev.block.location, offset)
	);

	let valid = true;

	check.forEach((required, vec) => {
		const b = ev.source.dimension.getBlock(
			Vector.add(original.location, vec)
		);
		if (b.typeId !== required) valid = false;
	});

	if (valid) {
		system.runTimeout(() => {
			const blockNow = ev.source.dimension.getBlock(
				Vector.add(ev.block.location, offset)
			);

			if (blockNow.typeId !== "minecraft:lava") return;

			original.setType("minecraft:budding_amethyst");
		}, 1200);
	}
});

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
	if (ev.block.typeId !== "minecraft:flowering_azalea") return;

	if (Math.random() * 100 < 5) {
		ev.dimension.spawnItem(
			new ItemStack("minecraft:spore_blossom"),
			ev.block.location
		);
	}
});
