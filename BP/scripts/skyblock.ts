
import { BlockStateSuperset } from "@minecraft/vanilla-data";
import {
	Block,
	BlockVolume,
	Dimension,
	EntitySpawnAfterEvent,
	ItemStack,
	ItemUseAfterEvent,
        MemoryTier,
	Player,
	PlayerBreakBlockBeforeEvent,
	PlayerDimensionChangeAfterEvent,
	PlayerInteractWithBlockAfterEvent,
	PlayerJoinAfterEvent,
	PlayerSpawnAfterEvent,
	ProjectileHitBlockAfterEvent,
	Vector3,
	system,
	world,
        BlockComponentOnPlaceEvent,
        BlockComponentPlayerBreakEvent,
        BlockComponentPlayerInteractEvent,
        BlockComponentTickEvent,
} from "@minecraft/server";

// --------------------------------------------------
// Coordinate System Reference (Bedrock)
// --------------------------------------------------

/*
Origin: Lower North West Corner

North: >>>>>>>>> (-z) - (Backwards)
Northeast: > (+x, -z) - (Back-Left)
East: >>>>>>>>>> (+x) - (Left)
Southeast >> (+x, +z) - (Front-Left)
South: >>>>>>>>> (+z) - (Forwards)
Southwest: > (-x, +z) - (Front-Right)
West: >>>>>>>>>> (-x) - (Right)
Northwest: > (-x, -z) - (Back-Right)
*/

// --------------------------------------------------
// Global Debug Toggle
// --------------------------------------------------

// Enables verbose console output through debugMsg()
const debugging: boolean = false;

// --------------------------------------------------
// Type Definitions
// --------------------------------------------------

/**
 * Represents block permutation configuration
 */
interface BlockPerms {
	perm: string;
	value: string | number | boolean;
}

/**
 * Represents a 3D offset range for block placement
 */
interface BlockOffset {
	from: Vector3;
	to: Vector3;
}

/**
 * Represents a single block definition in an island schema
 */
interface IslandBlock {
	block: string;
	perms?: BlockPerms;
	offset: BlockOffset;
}

/**
 * Represents a single loot item configuration
 */
interface LootItem {
	slot: number;
	item: string;
	amount: number;
}

/**
 * Represents loot configuration for an island
 */
interface IslandLoot {
	chestLoc: Vector3;
	items: Record<string, LootItem>;
}

/**
 * Island schema definition
 *
 * @property name - Display name of the island
 * @property dimension - Runtime-assigned dimension reference
 * @property targetDimension - Target dimension identifier
 * @property origin_offset - Offset from world spawn
 * @property loot - Optional loot chest configuration
 * @property blocks - Block placement definitions
 *
 * @remarks
 * All offsets are relative to island.origin_offset
 * from/to order does not matter; BlockVolume normalizes bounds
 */
interface Island {
	name: string;
	dimension?: Dimension;
	targetDimension: string;
	origin_offset: Vector3;
	loot?: IslandLoot;
	blocks: Record<string, IslandBlock>;
}

/**
 * Time breakdown in hours, minutes, and seconds
 */
interface TimeBreakdown {
	hours: number;
	minutes: number;
	seconds: number;
}

/**
 * Coordinate string formatting types
 */
type CoordStringType = "debug" | "command" | "noSpace" | "id";

// --------------------------------------------------
// Starter Island Definition
// --------------------------------------------------
const starterIsland: Island = {
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
const sandIsland: Island = {
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
		// Updates all sculk to be the correct permutation (sometimes its bugged so this is a backup)
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
const netherIsland: Island = {
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
const overworldIslands: Island[] = [starterIsland, sandIsland];
const netherIslands: Island[] = [netherIsland];

// --------------------------------------------------
// Player Cache
// --------------------------------------------------
const players: Map<string, Player> = new Map();

// --------------------------------------------------
// Utility Functions
// --------------------------------------------------

/**
 * Logs a debug message if debugging is enabled or if error flag is set.
 *
 * @param message - Message to log
 * @param error - If true, displays a console warning; otherwise respects debug flag
 */
function debugMsg(message: string, error: boolean = false): void {
	error ? console.warn(message) : debugging && console.log(message);
}

/**
 * Converts a Vector3 into a readable string.
 *
 * @param coords - Coordinates to stringify
 * @param type - Format type:
 *   - "debug" (default): prints with coords labeled
 *   - "command": prints numbers only with spaces
 *   - "noSpace": prints numbers one after another, no spaces
 *   - "id": prints coords in parentheses with colon separators
 * @returns Formatted string representation of coordinates
 */
function coordsString(coords: Vector3, type: CoordStringType = "debug"): string {
	switch (type) {
		case "debug":
			return `(X: ${coords.x}, Y: ${coords.y}, Z: ${coords.z})`;
		case "command":
			return `${coords.x} ${coords.y} ${coords.z}`;
		case "noSpace":
			return `${coords.x}${coords.y}${coords.z}`;
		case "id":
			return `(${coords.x}:${coords.y}:${coords.z})`;
		default:
			return `Invalid type provided for coordsString Function.`;
	}
}

/**
 * Applies an offset vector to an origin vector.
 *
 * @param origin - Base coordinates
 * @param offsets - Offset to apply
 * @returns New coordinates with offset applied
 */
function calculateOffsets(origin: Vector3, offsets: Vector3): Vector3 {
	return {
		x: origin.x + offsets.x,
		y: origin.y + offsets.y,
		z: origin.z + offsets.z,
	};
}

/**
 * Converts Minecraft ticks to real-world hours, minutes, and seconds.
 *
 * @param ticks - Number of game ticks (20 ticks = 1 second)
 * @returns Time breakdown object containing hours, minutes, and seconds
 */
function ticksToTime(ticks: number): TimeBreakdown {
	const totalSeconds = Math.floor(ticks / 20);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return { hours, minutes, seconds };
}

/**
 * Extracts block coordinates from a dynamic property identifier.
 *
 * Expected coordinate format inside the id: (X:Y:Z)
 *
 * @example
 * ```typescript
 * // Example ID format:
 * // kado:budAmWater-minecraft:overworld-(1:64:2)
 * const coords = parseCoordsFromId("kado:budAmWater-minecraft:overworld-(1:64:2)");
 * // Returns: { x: 1, y: 64, z: 2 }
 * ```
 *
 * @param id - Dynamic property identifier
 * @returns Parsed coordinates or undefined if invalid format
 */
function parseCoordsFromId(id: string): Vector3 | undefined {
	const match = id.match(/\((-?\d+):(-?\d+):(-?\d+)\)/);
	if (!match) return undefined;
	return {
		x: Number(match[1]),
		y: Number(match[2]),
		z: Number(match[3]),
	};
}

/**
 * Returns a random floating-point number within a range.
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value
 * @param inclusive - If true, max is inclusive; if false, max is exclusive
 * @param whole - If true, returns whole number; if false, returns float
 * @returns Random number between min and max
 */
function randomNum(min: number, max: number, inclusive: boolean = true, whole: boolean = false): number {
	const val = inclusive
		? Math.random() * (max - min + 1) + min
		: Math.random() * (max - min) + min;
	return whole ? Math.floor(val) : val;
}

// --------------------------------------------------
// Wait for Chunk Loaded
// --------------------------------------------------

/**
 * Resolves once the chunk containing the given location is loaded.
 *
 * @param dimension - Dimension to wait for load in
 * @param location - Location to wait for load
 * @param intervalTicks - Poll interval in ticks (default: 20, 1 second)
 * @param timeoutTicks - Cutoff time in ticks (default: 1200, 1 minute)
 * @returns Promise that resolves when chunk is loaded or rejects on timeout
 * @throws Error if chunk fails to load within timeout period
 */
// butts=-2(chunky+5buttnut)*overbort/futbutt08dups
function waitForChunkLoaded(
	dimension: Dimension,
	location: Vector3,
	intervalTicks: number = 20,
	timeoutTicks: number = 1200
): Promise<void> {
	return new Promise((resolve, reject) => {
		let waited = 0;

		const check = system.runInterval(() => {
			waited += intervalTicks;

			try {
				const block = dimension.getBlock(location);
				if (block) {
					system.clearRun(check);
					resolve();
				}
			} catch {}

			if (waited >= timeoutTicks) {
				system.clearRun(check);
				reject(new Error("Chunk load timeout"));
			}
		}, intervalTicks);
	});
}

// --------------------------------------------------
// Island Build Functions
// --------------------------------------------------

/**
 * Resolves the dimension object for an island.
 *
 * @param island - Island object with targetDimension property
 * @returns True if successful, false if dimension resolution failed
 */
function prepareIsland(island: Island): boolean {
	try {
		island.dimension = world.getDimension(island.targetDimension);
		return true;
	} catch (error) {
		debugMsg(`Failed to resolve dimension for island: ${island.name}`, true);
		return false;
	}
}

/**
 * Creates a circular ticking area centered at a location.
 * Ensures blocks remain loaded during asynchronous operations.
 *
 * @param dimension - Target dimension
 * @param location - Center point for ticking area
 * @param name - Unique ticking area identifier
 */
function createTickingArea(dimension: Dimension, location: Vector3, name: string): void {
	dimension.runCommand(`tickingarea add circle ${coordsString(location, "command")} 2 ${name}`);
	debugMsg(`Ticking area "${name}" created at ${coordsString(location)}`);
}

/**
 * Removes a previously created ticking area by name.
 *
 * @param dimension - Target dimension
 * @param name - Ticking area identifier to remove
 */
function removeTickingArea(dimension: Dimension, name: string): void {
	dimension.runCommand(`tickingarea remove ${name}`);
	debugMsg(`Ticking area "${name}" removed`);
}

/**
 * Applies block permutations efficiently.
 *
 * @param iteration - Block definition with permutation configuration
 * @param from - Volume start coordinates
 * @param to - Volume end coordinates
 * @param dimension - Target dimension
 */
function applyBlockPermutations(
	iteration: IslandBlock,
	from: Vector3,
	to: Vector3,
	dimension: Dimension
): void {
	if (!iteration.perms) return;

	const permId = iteration.perms.perm as keyof BlockStateSuperset;
	const permValue = iteration.perms.value;
	// Single-block optimization avoids unnecessary triple loops and prevents edge cases with unloaded neighbors
	const singleBlock = from.x === to.x && from.y === to.y && from.z === to.z ? from : undefined;
	if (singleBlock) {
		const block = dimension.getBlock(singleBlock);
		if (!block) return;
		block.setPermutation(block.permutation.withState(permId, permValue));
		debugMsg(`Set permutation ${permId}=${permValue} at ${coordsString(from)}`, false);
		return;
	}
	for (let x = from.x; x <= to.x; x++) {
		for (let y = from.y; y <= to.y; y++) {
			for (let z = from.z; z <= to.z; z++) {
				const block = dimension.getBlock({ x, y, z });
				if (!block) continue;
				block.setPermutation(block.permutation.withState(permId, permValue));
			}
		}
	}
	debugMsg(
		`Set permutation ${permId}=${permValue} for volume ${coordsString(from)} -> ${coordsString(
			to,
		)}`,
	);
}

/**
 * Builds all blocks of an island.
 *
 * @param island - Island object with block definitions
 * @param worldOrigin - World origin reference point
 */
function buildIslandBlocks(island: Island, worldOrigin: Vector3): void {
	const dimension = island.dimension;
	if (!dimension) return;
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	debugMsg(
		`${island.name} origin resolved at ${coordsString(islandOrigin)}\nBuilding Island Now...`,
	);
	for (const key in island.blocks) {
		const iteration = island.blocks[key];
		const from = calculateOffsets(islandOrigin, iteration.offset.from);
		const to = calculateOffsets(islandOrigin, iteration.offset.to);
		debugMsg(`Building "${key}" from ${coordsString(from)} to ${coordsString(to)}`, false);
		const volume = new BlockVolume(from, to);
		dimension.fillBlocks(volume, iteration.block);
		if (iteration.perms) applyBlockPermutations(iteration, from, to, dimension);
	}
}

/**
 * Locates a chest on an island and fills it with loot.
 *
 * @param island - Island object with loot configuration
 * @param worldOrigin - World origin reference point
 */
function fillChest(island: Island, worldOrigin: Vector3): void {
	const dimension = island.dimension;
	if (!dimension || !island.loot) return;

	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	const chestLoc = calculateOffsets(islandOrigin, island.loot.chestLoc);
	const chestBlock = dimension.getBlock(chestLoc);
	if (chestBlock?.typeId === "minecraft:chest") {
		const chestEntity = chestBlock.getComponent("minecraft:inventory");
		if (!chestEntity || chestEntity === undefined || !chestEntity.container) return;
		const lootTable = island.loot.items;
		system.run(() => {
			for (let loot in lootTable) {
				const iteration = lootTable[loot];
				chestEntity.container!.setItem(
					iteration.slot,
					new ItemStack(iteration.item, iteration.amount),
				);
			}
		});
		debugMsg(
			`${island.name}	Loot Chest found and filled at location: ${coordsString(chestLoc)}`,
			false,
		);
	} else {
		debugMsg(`${island.name} Loot Chest not found at location: ${coordsString(chestLoc)}`, true);
	}
}

/**
 * Fills chest with loot if defined.
 *
 * @param island - Island object with optional loot configuration
 * @param worldOrigin - World origin reference point
 */
function finalizeIslandLoot(island: Island, worldOrigin: Vector3): void {
	if (!island.loot) return;
	fillChest(island, worldOrigin);
}

/**
 * Temporarily prevents player movement by repeatedly teleporting them.
 * Used during island generation to avoid player interference
 * or falling before terrain exists.
 *
 * @param player - Player to suspend
 * @param location - Fixed teleport location
 * @param ticks - Duration in ticks (default: 40)
 */
function suspendPlayer(player: Player, location: Vector3, ticks: number = 40): void {
	const suspend = system.runInterval(() => {
		player.tryTeleport(location);
		debugMsg(`${player.name} Suspended.`);
	}, 5);
	system.runTimeout(() => {
		system.clearRun(suspend);
	}, ticks);
}

/**
 * Fully generates an island instance.
 *
 * Steps:
 * - Resolves target dimension
 * - Creates a temporary ticking area
 * - Builds island blocks
 * - Populates loot chests
 * - Cleans up ticking area
 *
 * @param island - Island definition
 * @param worldOrigin - World origin reference point
 */
function generateIsland(island: Island, worldOrigin: Vector3): void {
	if (!prepareIsland(island)) return;
	const islandOrigin = calculateOffsets(worldOrigin, island.origin_offset);
	const tickName = `${island.name.replace(/\s+/g, "_").toLowerCase()}`;
	createTickingArea(island.dimension!, islandOrigin, tickName);
	system.run(async () => {
		await waitForChunkLoaded(island.dimension!, islandOrigin);
		buildIslandBlocks(island, worldOrigin);
		finalizeIslandLoot(island, worldOrigin);
		debugMsg(`${island.name} generation complete.`);
		system.runTimeout(() => {
			removeTickingArea(island.dimension!, tickName);
		}, 20);
	});
}

// --------------------------------------------------
// Renewable Amethyst Functions
// --------------------------------------------------
/**
 * Validates amethyst geode structure at a given location.
 *
 * Checks for proper layering:
 * - Center: target block
 * - Inner layer: calcite (6 blocks)
 * - Outer layer: smooth basalt (18 blocks)
 *
 * @param dimension - Target dimension
 * @param blockLoc - Center block location
 * @returns
 *   - true: structure valid
 *   - false: structure invalid
 *   - undefined: cannot evaluate (unloaded chunks)
 */
function validGeode(dimension: Dimension, blockLoc: Vector3): boolean | undefined {
	const inner = "minecraft:calcite";
	const outer = "minecraft:smooth_basalt";
	const center = dimension.getBlock(blockLoc);
	if (!center || !dimension.isChunkLoaded(center.location)) return undefined;
	const innerChecks = [
		center.above(),
		center.north(),
		center.east(),
		center.south(),
		center.west(),
		center.below(),
	];
	for (const block of innerChecks) {
		if (block?.typeId === undefined) return undefined;
		if (block?.typeId !== inner) return false;
	}
	const outerChecks = [
		center.above(2),
		center.above()?.north(),
		center.above()?.east(),
		center.above()?.south(),
		center.above()?.west(),
		center.north(2),
		center.north()?.east(),
		center.east(2),
		center.east()?.south(),
		center.south(2),
		center.south()?.west(),
		center.west(2),
		center.west()?.north(),
		center.below(2),
		center.below()?.north(),
		center.below()?.east(),
		center.below()?.south(),
		center.below()?.west(),
	];
	for (const block of outerChecks) {
		if (block?.typeId === undefined) return undefined;
		if (block?.typeId !== outer) return false;
	}
	return true;
}

/**
 * Generates a randomized delay for budding amethyst conversion.
 *
 * The returned value:
 * - Is between 108000 and 144000 ticks (inclusive)
 * - Is always a multiple of the provided step value
 *
 * @param step - Tick step increment (e.g., 20, 100)
 * @returns Randomized delay in ticks
 */
function randomBudAmDelay(step: number = 20): number {
	const min = 108000;
	const max = 144000;
	return min + Math.round(Math.random() * ((max - min) / step + 1)) * step;
}

// --------------------------------------------------
// Reusable Custom Vaults Functions
// --------------------------------------------------
/**
 * Generates a unique cooldown identifier for a vault-player pair.
 *
 * Cooldowns are scoped by:
 * - Dimension
 * - Vault type
 * - Vault block location
 * - Player identifier
 *
 * This allows:
 * - Multiple players to use the same vault independently
 * - One player to interact with multiple vaults concurrently
 *
 * @param block - Vault block
 * @param player - Player interacting with the vault
 * @returns Dynamic property key for cooldown tracking
 */
function makeVaultCooldownId(block: Block, player: Player): string {
	return `kado:vault-${block.permutation.getState(vaultBlockType)}-${coordsString(block.location, "noSpace")}-${player.name}`;
}

/**
 * Sequentially ejects generated vault loot items.
 *
 * Behavior:
 * - Opens the vault shutter
 * - Dispenses one item per second
 * - Applies controlled impulse for visual ejection
 * - Returns vault to ACTIVE state after completion
 *
 * @param dimension - Vault block dimension
 * @param block - Vault block
 * @param lootRoll - Generated loot entries
 */
function dispenseVaultLoot(dimension: Dimension, block: Block, lootRoll: ItemStack[]): void {
	dimension.playSound("vault.open_shutter", block.location);
	system.runTimeout(() => {
		let iter = 0;
		const ejecting = system.runInterval(() => {
			if (iter < lootRoll.length) {
				const itemEntity = dimension.spawnItem(lootRoll[iter], {
					x: block.location.x + 0.5,
					y: block.location.y + 1,
					z: block.location.z + 0.5,
				});
				itemEntity.clearVelocity();
				itemEntity.applyImpulse({
					x: randomNum(-0.033, 0.033, false),
					y: 0.25,
					z: randomNum(-0.025, 0.025, false),
				});
				dimension.playSound("vault.eject_item", block.location);
				iter++;
				return;
			}
			system.clearRun(ejecting);
			block.setPermutation(block.permutation.withState(vaultBlockState, "inactive"));
			dimension.playSound("vault.deactivate", block.location);
		}, 20);
	}, 10);
}

// --------------------------------------------------
// Ancient City Shrieker Utilities
// --------------------------------------------------
/**
 * Checks whether a chunk contains any Deep Dark biome samples.
 *
 * @param overworld - Target dimension
 * @param chunkX - Chunk X coordinate
 * @param chunkZ - Chunk Z coordinate
 * @returns True if chunk contains Deep Dark biome, false otherwise
 */
function chunkHasDeepDark(overworld: Dimension, chunkX: number, chunkZ: number) {
	return (
		overworld.getBiome({ x: chunkX * 16 + 8, y: -48, z: chunkZ * 16 + 8 })?.id ===
		"minecraft:deep_dark"
	);
}

/**
 * Finds all sculk shriekers in a chunk and converts target blocks to summonable shriekers.
 *
 * @param dimension - Target dimension
 * @param chunkX - Chunk X coordinate
 * @param chunkZ - Chunk Z coordinate
 */
function findTargetBlock(dimension: Dimension, chunkX: number, chunkZ: number): void {
	const startX = chunkX * 16;
	const startZ = chunkZ * 16;
	for (let x = 0; x < 16; x++) {
		for (let z = 0; z < 16; z++) {
			const block = dimension.getBlock({ x: startX + x, y: -48, z: startZ + z });
			if (!block) continue;
			if (block.typeId === "minecraft:target") {
				dimension.setBlockType(block.location, "minecraft:sculk_shrieker");
                                const shrieker = dimension.getBlock(block.location);
                                if (shrieker === undefined) return;
				shrieker.setPermutation(shrieker.permutation.withState("can_summon", true));
				debugMsg(
					`Target at ${coordsString(shrieker.location)} converted into summonable shrieker.`,
				);
				break;
			}
		}
	}
}

/**
 * Calculates Euclidean distance between two vectors.
 *
 * @param vectorA - First position vector
 * @param vectorB - Second position vector
 * @returns Distance between the two vectors
 */
function calculateDistance(vectorA: Vector3, vectorB: Vector3): number {
	const distanceX = vectorA.x - vectorB.x;
	const distanceY = vectorA.y - vectorB.y;
	const distanceZ = vectorA.z - vectorB.z;
	return Math.sqrt(distanceX ** 2 + distanceY ** 2 + distanceZ ** 2);
}

// --------------------------------------------------
// Before Startup Hook Component Registry for Reusable Custom Vaults
// --------------------------------------------------
const vaultBlockState = "kado:vault_state" as keyof BlockStateSuperset;
const vaultBlockType = "kado:vault_type" as keyof BlockStateSuperset
system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent("kado:vault", {
		onTick(eventData: BlockComponentTickEvent): void {
			const { block, dimension } = eventData;
			const activationDist = 3.5;
			const blockCenter = {
				x: block.location.x + 0.5,
				y: block.location.y + 0.5,
				z: block.location.z + 0.5,
			};
			const particleLoc = {
				x: block.location.x + randomNum(0.1, 0.9, false),
				y: block.location.y + randomNum(0.1, 0.9, false),
				z: block.location.z + randomNum(0.1, 0.9, false),
			};
			dimension.spawnParticle("minecraft:basic_smoke_particle", particleLoc);
			// World-level, per player cooldown ticking
			for (const player of players.values()) {
				const cooldownId = makeVaultCooldownId(block, player);
				const cooldown = (world.getDynamicProperty(cooldownId) as number | undefined) ?? 0;
				if (cooldown > 0) {
					const next = Math.max(cooldown - 10, 0);
					world.setDynamicProperty(cooldownId, next);
					if (next % 600 === 0 || cooldown === 6000) {
						const time = ticksToTime(next);
						debugMsg(`${cooldownId}] Cooldown: ${time.minutes}m ${time.seconds}s`, false);
					}
					block.setPermutation(block.permutation.withState(vaultBlockState, "inactive"));
					continue;
				}
			}
			if (block.permutation.getState(vaultBlockState) === "dispensing") return;
			let hasEligiblePlayerNearby = false;
			for (const player of players.values()) {
				const xDist = player.location.x - blockCenter.x;
				const yDist = player.location.y - blockCenter.y;
				const zDist = player.location.z - blockCenter.z;
				const inRange = xDist ** 2 + yDist ** 2 + zDist ** 2 <= activationDist ** 2;
				if (!inRange) continue;
				const vaultKey = makeVaultCooldownId(block, player);
				const cooldown = (world.getDynamicProperty(vaultKey) as number | undefined) ?? 0;
				if (cooldown === 0) {
					hasEligiblePlayerNearby = true;
					break;
				}
			}
			const newState = hasEligiblePlayerNearby
				? { state: "active", sound: "vault.activate" }
				: { state: "inactive", sound: "vault.deactivate" };
			const particle =
				block.permutation.getState(vaultBlockType) === "normal"
					? "minecraft:basic_flame_particle"
					: "minecraft:blue_flame_particle";
			if (
				block.permutation.getState(vaultBlockState) === "active" ||
				block.permutation.getState(vaultBlockState) === "dispensing"
			) {
				dimension.spawnParticle(particle, particleLoc);
			}
			if (block.permutation.getState(vaultBlockState) !== newState.state) {
				block.setPermutation(block.permutation.withState(vaultBlockState, newState.state));
				dimension.playSound(newState.sound, block.location);
			}
		},
		onPlace(eventData: BlockComponentOnPlaceEvent): void {
			const { block } = eventData;
			block.setPermutation(
				block.permutation
					.withState(vaultBlockType, "normal")
					.withState(vaultBlockState, "inactive"),
			);
		},
		onPlayerBreak(eventData: BlockComponentPlayerBreakEvent): void {
			const { block, brokenBlockPermutation } = eventData;
			const cooldownPrefix = `kado:reCusVault-${
				block.dimension.id
			}-${brokenBlockPermutation.getState(vaultBlockType)}-${coordsString(
				block.location,
				"id",
			)}-`;
			for (const cooldownId of world.getDynamicPropertyIds()) {
				if (cooldownId.startsWith(cooldownPrefix)) {
					world.setDynamicProperty(cooldownId, undefined);
				}
			}
		},
		onPlayerInteract(eventData: BlockComponentPlayerInteractEvent): void {
                        const { dimension, player, block } = eventData;
                        if (player === undefined) return;
			const inventory = player.getComponent("minecraft:inventory");
			const mainHand = inventory?.container?.getItem(player.selectedSlotIndex);
                        const permutation = block.permutation;
                        const vaultType = permutation.getState(vaultBlockType)
			const cooldownId = makeVaultCooldownId(block, player);
			// Creative Vault Type Toggle
			if (
				player?.getGameMode() === "Creative" &&
				(!mainHand || mainHand.typeId === "kado:vault")
			) {
				const oldType = vaultType;
				block.setPermutation(
					permutation.withState(
						vaultBlockType,
						oldType === "normal" ? "ominous" : "normal",
					),
				);
				const oldPrefix = `kado:reCusVault-${block.dimension.id}-${oldType}-${coordsString(
					block.location,
					"id",
				)}-`;
				for (const id of world.getDynamicPropertyIds()) {
					if (id.startsWith(oldPrefix)) {
						world.setDynamicProperty(id, undefined);
					}
				}
				return;
			}
			// Survival Interractions
			if (
				(((world.getDynamicProperty(cooldownId) as number | undefined) ?? 0) > 0 &&
					permutation.getState(vaultBlockState) !== "active") ||
				player?.getGameMode() !== "Survival"
			) {
				dimension.playSound("vault.reject_rewarded_player", block.location);
				return;
			}
			const keyType = mainHand?.typeId;
			const valid =
				(keyType === "minecraft:trial_key" && vaultType === "normal") ||
				(keyType === "minecraft:ominous_trial_key" &&
					vaultType === "ominous" &&
					permutation.getState(vaultBlockState) === "active");
			if (!valid) {
				dimension.playSound("vault.reject_rewarded_player", block.location);
				return;
			}
			if (!mainHand) return;
			if (mainHand.amount > 1) {
				inventory?.container?.setItem(
					player.selectedSlotIndex,
					new ItemStack(keyType, mainHand.amount - 1),
				);
			} else {
				inventory?.container?.setItem(player.selectedSlotIndex, undefined);
			}
			dimension.playSound("vault.insert_item", block.location);
			const lootManager = world.getLootTableManager();
			const lootTable =
				vaultType === "normal"
					? lootManager.getLootTable("chests/trial_chambers/reward")
                                        : lootManager.getLootTable("chests/trial_chambers/reward_ominous");
                        if (lootTable === undefined) return;
			const lootRoll = lootManager.generateLootFromTable(lootTable);
			block.setPermutation(permutation.withState(vaultBlockState, "dispensing"));
                        if (lootRoll === undefined) return;
			dispenseVaultLoot(dimension, block, lootRoll);
			system.runTimeout(
				() => {
					world.setDynamicProperty(cooldownId, 6000);
				},
				lootRoll.length * 20 + 15,
			);
		},
	});
});

// --------------------------------------------------
// After World Load Hook for Renewable Budding Amethyst
// --------------------------------------------------
world.afterEvents.worldLoad.subscribe(() => {
	let initialized = false;
	const initInterval = system.runInterval(() => {
		// Wait until at least one player exists
		const allPlayers = world.getAllPlayers();
		if (allPlayers.length === 0) return;
		// Initialize player registry
		for (const player of allPlayers) {
			players.set(player.id, player);
		}
		console.log(`Initialized player registry with ${players.size} players.`);
		initialized = true;
		// Stop retrying
		system.clearRun(initInterval);
	}, 20);
	let currentChunk: { X: number; Z: number } | undefined;
	system.runInterval(() => {
		if (!initialized) return;
		for (const player of players.values()) {
			const dimension = player.dimension;
			if (dimension.id !== "minecraft:overworld") continue;
			const playerChunkX = Math.floor(player.location.x / 16);
			const playerChunkZ = Math.floor(player.location.z / 16);
			const newChunk = { X: playerChunkX, Z: playerChunkZ };
			if (currentChunk === newChunk) continue;
			let radius; // number of chunks around player to check
			const playerMemTier = player.clientSystemInfo.memoryTier;
			switch (playerMemTier) {
				case MemoryTier.SuperLow:
					debugMsg(`Client Total Memory: Under 1.5 GB (Super Low)`);
					radius = 8;
					break;
				case MemoryTier.Low:
					debugMsg(`Client Total Memory: 1.5 - 2.0 GB (Low)`);
					radius = 10;
					break;
				case MemoryTier.Mid:
					debugMsg(`Client Total Memory: 2.0 - 4.0 GB (Mid)`);
					radius = 12;
					break;
				case MemoryTier.High:
					debugMsg(`Client Total Memory: 4.0 - 8.0 GB (High)`);
					radius = 16;
					break;
				case MemoryTier.SuperHigh:
					debugMsg(`Client Total Memory: Over 8.0 GB (Super High)`);
					radius = 25;
					break;
				default:
					radius = 8;
					break;
			}
			for (let distanceX = -radius; distanceX <= radius; distanceX++) {
				for (let distanceZ = -radius; distanceZ <= radius; distanceZ++) {
					const chunkX = playerChunkX + distanceX;
					const chunkZ = playerChunkZ + distanceZ;
					// Skip already checked chunks
					const key = `kado:chunkLoaded-(${chunkX}:${chunkZ})`;
					if (world.getDynamicProperty(key)) continue;
					if (!dimension.isChunkLoaded({ x: chunkX * 16, y: 0, z: chunkZ * 16 })) continue;
					if (chunkHasDeepDark(dimension, chunkX, chunkZ)) {
						findTargetBlock(dimension, chunkX, chunkZ);
					}
					world.setDynamicProperty(key, true);
				}
			}
		}
	}, 20);
	system.runTimeout(() => {
		system.runInterval(() => {
			const propIds = world.getDynamicPropertyIds();
			for (const propId of propIds) {
				if (!propId.startsWith("kado:budAmWater-")) continue;
				const remaining = world.getDynamicProperty(propId) as number | undefined;
				if (remaining === undefined) continue;
				const waterBlockLoc = parseCoordsFromId(propId);
				if (!waterBlockLoc) {
					world.setDynamicProperty(propId, undefined);
					continue;
				}
				const dimension = world.getDimension(propId.split("-")[1]);
				if (!dimension) continue;
				const block = dimension.getBlock(waterBlockLoc);
				if (!block) continue;
				// Water removed -> forget
				if (block.typeId !== "minecraft:water") {
					world.setDynamicProperty(propId, undefined);
					continue;
				}
				if (!dimension.isChunkLoaded(block.location)) continue;
				const geodeState = validGeode(dimension, waterBlockLoc);
				debugMsg(`Geode State: ${geodeState}`);
				// Some blocks not loaded -> pause (do nothing)
				if (geodeState === undefined) {
					continue;
				}
				// Structure broken -> reset delay
				if (geodeState === false) {
					world.setDynamicProperty(propId, randomBudAmDelay());
					continue;
				}
				// geodeState === true -> countdown
				const newDelay = Math.max(remaining - 20, 0);
				world.setDynamicProperty(propId, newDelay);
				if (newDelay % 600 === 0) {
					const time = ticksToTime(newDelay);
					debugMsg(`[${propId}] Cooldown: ${time.minutes}m ${time.seconds}s`, false);
				}
				if (newDelay === 0) {
					dimension.setBlockType(waterBlockLoc, "minecraft:budding_amethyst");
					world.setDynamicProperty(propId, undefined);
					debugMsg(
						`World Dynamic Property '${propId}' set to ${world.getDynamicProperty(
							propId,
						)} and removed.\nWater at ${coordsString(
							waterBlockLoc,
						)} converted to Buddding Amethyst.`,
						false,
					);
				}
				continue;
			}
		}, 20);
	}, 10);
});

// --------------------------------------------------
// After Player Join Hook to update Players Cache Map
// --------------------------------------------------
world.afterEvents.playerJoin.subscribe((eventData: PlayerJoinAfterEvent) => {
	const { playerId, playerName } = eventData;
	// Player object is not available yet — wait 1 tick
	system.run(() => {
		const player = world.getAllPlayers().find((p) => p.id === playerId);
		if (!player) return;

		players.set(player.id, player);
		debugMsg(`${playerName} joined. Registry size: ${players.size}`);
	});
});

// --------------------------------------------------
// After Player Spawn Hook for World Initialization
// --------------------------------------------------
world.afterEvents.playerSpawn.subscribe((eventData: PlayerSpawnAfterEvent) => {
	const { player, initialSpawn } = eventData;
	if (world.getDynamicProperty("kado:overworld_unlocked")) {
		debugMsg(`This world's overworld has already been initialized`);
		return;
	}
	const spawn = {
		x: world.getDefaultSpawnLocation().x,
		y: 65,
		z: world.getDefaultSpawnLocation().z,
	};
	debugMsg(`Spawn Found: ${coordsString(spawn)}\n${player.name} awaiting island generation.`);
	suspendPlayer(player, { x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 });
	// Thanks Lyvvy <3
	for (const island of overworldIslands) generateIsland(island, spawn);
	world.setDynamicProperty("kado:overworld_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:overworld_unlocked" - ${world.getDynamicProperty(
			"kado:overworld_unlocked",
		)}`,
	);
});

// --------------------------------------------------
// After Player Interact Hook for Renewable Budding Amethyst
// --------------------------------------------------
world.afterEvents.playerInteractWithBlock.subscribe((eventData: PlayerInteractWithBlockAfterEvent) => {
	const { player, beforeItemStack, itemStack, block, blockFace } = eventData;
	if (
		player.getGameMode() === "Creative" &&
		block.typeId === "minecraft:loom" &&
		itemStack?.typeId === "minecraft:brush"
	) {
		const props = world.getDynamicPropertyIds();
		for (const prop of props) {
			if (
				prop !== "kado:overworld_unlocked" &&
				prop !== "kado:nether_unlocked" &&
				!prop.startsWith("kado:budAmWater")
			) {
				world.setDynamicProperty(prop, undefined);
				debugMsg(`Property: ${prop} found, set to undefined, and removed.`);
			}
		}
		return;
	}
	if (
		(beforeItemStack?.typeId === "minecraft:water_bucket" &&
			itemStack?.typeId === "minecraft:bucket" &&
			player.getGameMode() === "Survival") ||
		(beforeItemStack?.typeId === "minecraft:water_bucket" &&
			(itemStack?.typeId === "minecraft:bucket" ||
				itemStack?.typeId === "minecraft:water_bucket") &&
			player.getGameMode() === "Creative")
	) {
		// Water placed
		let tempBlock: Block | undefined;
		switch (blockFace) {
			case "Up": {
				tempBlock = block.above();
				break;
			}
			case "North": {
				tempBlock = block.north();
				break;
			}
			case "East": {
				tempBlock = block.east();
				break;
			}
			case "South": {
				tempBlock = block.south();
				break;
			}
			case "West": {
				tempBlock = block.west();
				break;
			}
			case "Down": {
				tempBlock = block.below();
				break;
			}
			default: {
				tempBlock = undefined;
				break;
			}
		}
		if (!tempBlock || tempBlock.typeId !== "minecraft:water") return;
		const placedWaterBlock = tempBlock;
		const delay = randomBudAmDelay();
		const propId = `kado:budAmWater-${player.dimension.id}-${coordsString(
			placedWaterBlock.location,
			"id",
		)}`;
		world.setDynamicProperty(propId, delay);
		debugMsg(
			`World Dynamic Property '${propId}' set to world with a value of ${world.getDynamicProperty(
				propId,
			)}.`,
			false,
		);
		return;
	}
	// Water picked up
	if (
		(beforeItemStack?.typeId === "minecraft:bucket" &&
			itemStack?.typeId === "minecraft:water_bucket" &&
			player.getGameMode() === "Survival") ||
		(beforeItemStack?.typeId === "minecraft:water_bucket" &&
			itemStack?.typeId === "minecraft:water_bucket" &&
			player.getGameMode() === "Creative")
	) {
		const propId = `kado:budAmWater-${player.dimension.id}-${coordsString(block.location, "id")}`;
		world.setDynamicProperty(propId, undefined);
		debugMsg(
			`World Dynamic Property '${propId}' set to ${world.getDynamicProperty(
				propId,
			)} and removed.`,
			false,
		);
	}
});

// --------------------------------------------------
// Before Player Break Block Hook for:
// Silk Touch Budding Amethyst
// Renewable Spore Blossoms
// --------------------------------------------------
world.beforeEvents.playerBreakBlock.subscribe((eventData: PlayerBreakBlockBeforeEvent) => {
	const { player, block, itemStack, dimension } = eventData;
	if (player.getGameMode() !== "Survival" || itemStack?.typeId === "minecraft:shears") return;
	let doSpawn: string | undefined = undefined;
	const enchantable = itemStack?.getComponent("minecraft:enchantable");
	const hasSilkTouch = enchantable?.hasEnchantment("minecraft:silk_touch");
	const hasFortune = enchantable?.hasEnchantment("minecraft:fortune");
	// Fortune level (0–3)
	let fortuneLevel = 0;
        if (hasFortune) {
                if (enchantable === undefined) return;
		const fortune = enchantable.getEnchantment("minecraft:fortune");
		fortuneLevel = Math.min(fortune?.level ?? 0, 3);
	}
	// Flowering azalea (Fortune-scaled)
	// REFACTOR TO BE REUSABLE WITH MORE BLOCKS
	if (block.typeId === "minecraft:azalea_leaves_flowered" && !hasSilkTouch) {
		const dropChance = 0.01 * (1 + fortuneLevel);
		const dropRoll = Math.random();
		debugMsg(`Chance: ${dropChance}\nRoll: ${dropRoll}`);
		if (dropRoll < dropChance) {
			doSpawn = "minecraft:spore_blossom";
			debugMsg(`Spore Blossom Dropped`);
		}
	}
	// Budding amethyst (Silk Touch only)
	// REFACTOR TO BE REUSABLE WITH MORE BLOCKS
	if (!doSpawn && block.typeId === "minecraft:budding_amethyst" && itemStack && hasSilkTouch) {
		const isValidPickaxe =
			itemStack.typeId === "minecraft:copper_pickaxe" ||
			itemStack.typeId === "minecraft:iron_pickaxe" ||
			itemStack.typeId === "minecraft:diamond_pickaxe" ||
			itemStack.typeId === "minecraft:netherite_pickaxe";
		if (isValidPickaxe) {
			doSpawn = "minecraft:budding_amethyst";
			debugMsg(`Budding Amethyst Dropped`);
		}
	}
	if (!doSpawn) return;
	const dropBlock = new ItemStack(doSpawn, 1);
	system.run(() => {
		player.dimension.spawnItem(dropBlock, {
			x: block.location.x + 0.5,
			y: block.location.y + 0.5,
			z: block.location.z + 0.5,
		});
	});
});

// --------------------------------------------------
// After Item Use Hook for Renewable Deepslate
// --------------------------------------------------
world.afterEvents.itemUse.subscribe((eventData: ItemUseAfterEvent) => {
	const { source, itemStack } = eventData;
	if (
		source.typeId !== "minecraft:player" ||
		itemStack.typeId !== "minecraft:splash_potion" ||
		itemStack.nameTag !== "%potion.thick.splash.name"
	)
		return;
	source.addTag("kado:threwThickPotion");
	debugMsg(`${source.nameTag} threw a Thick Splash Potion`);
});

// --------------------------------------------------
// After Entity Spawn Hook for Renewable Deepslate
// --------------------------------------------------
world.afterEvents.entitySpawn.subscribe((eventData: EntitySpawnAfterEvent) => {
	const { entity } = eventData;
	if (entity.typeId !== "minecraft:splash_potion") return;
	const source = entity.getComponent("minecraft:projectile")?.owner;
	if (source?.typeId !== "minecraft:player" || !source?.hasTag("kado:threwThickPotion")) return;
	entity.addTag("kado:isThickPotion");
	debugMsg(`Marked splash potion ${entity.id} as Thick Potion`);
});

// --------------------------------------------------
// After Projectile Hit Block Hook for Renewable Deepslate
// --------------------------------------------------
world.afterEvents.projectileHitBlock.subscribe((eventData: ProjectileHitBlockAfterEvent) => {
	const { dimension, location, projectile, source } = eventData;
	const blockHit = eventData.getBlockHit();
	const { face, block } = blockHit;
	if (projectile.typeId !== "minecraft:splash_potion" || !source?.hasTag("kado:threwThickPotion"))
		return;
	source.removeTag("kado:threwThickPotion");
	debugMsg(`Potion hit face: "${face}" at ${coordsString(location)}`);
	let effectCenter: Vector3;
	switch (face) {
		case "North": {
			effectCenter = {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) - 0.5,
			};
			break;
		}
		case "West": {
			effectCenter = {
				x: Math.floor(location.x) - 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) + 0.5,
			};
			break;
		}
		case "Down": {
			effectCenter = {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) - 0.5,
				z: Math.floor(location.z) + 0.5,
			};
			break;
		}
		default: {
			effectCenter = {
				x: Math.floor(location.x) + 0.5,
				y: Math.floor(location.y) + 0.5,
				z: Math.floor(location.z) + 0.5,
			};
			break;
		}
	}
	debugMsg(`Effect location calculated to ${coordsString(effectCenter)}.`);
	const radius = 1.4;
	const blockHitsVol = new BlockVolume(
		{
			x: effectCenter.x + radius,
			y: effectCenter.y + radius,
			z: effectCenter.z + radius,
		},
		{
			x: effectCenter.x - radius,
			y: effectCenter.y - radius,
			z: effectCenter.z - radius,
		},
	);
	const blockHits = dimension.getBlocks(blockHitsVol, {
		includeTypes: ["minecraft:stone"],
	});
	dimension.fillBlocks(blockHits, "minecraft:deepslate");
});

// --------------------------------------------------
// After Dimension Change Hook for Nether Initialization
// --------------------------------------------------
world.afterEvents.playerDimensionChange.subscribe((eventData: PlayerDimensionChangeAfterEvent) => {
	const { player, toDimension, toLocation } = eventData;
	if (toDimension.id === "minecraft:overworld") {
		debugMsg(`This world's overworld has already been initialized`);
		return;
	} else if (
		toDimension.id === "minecraft:nether" &&
		world.getDynamicProperty("kado:nether_unlocked")
	) {
		debugMsg(`This world's nether has already been initialized`);
		return;
	} else if (toDimension.id === "minecraft:the_end") return;
	debugMsg(`toLocation: ${coordsString(toLocation)}`);
	debugMsg(`player.location: ${coordsString(player.location)}`);
	const origin = { x: toLocation.x, y: toLocation.y + 5, z: toLocation.z };
	suspendPlayer(player, { x: origin.x + 0.5, y: origin.y, z: origin.z + 0.99 }, 10);
	debugMsg(`Origin Found: ${coordsString(origin)}\n${player.name} awaiting island generation.`);
	for (const island of netherIslands) generateIsland(island, origin);
	world.setDynamicProperty("kado:nether_unlocked", true);
	debugMsg(
		`Dynamic Property: "kado:nether_unlocked" - ${world.getDynamicProperty(
			"kado:nether_unlocked",
		)}`,
	);
});

// --------------------------------------------------
// After Player Leave Hook to update Players Cache
// --------------------------------------------------
world.afterEvents.playerLeave.subscribe((eventData) => {
        const { playerId, playerName } = eventData;
        if (players.delete(playerId)) {
                debugMsg(`${playerName} left. Registry size: ${players.size}`);
        }
});
