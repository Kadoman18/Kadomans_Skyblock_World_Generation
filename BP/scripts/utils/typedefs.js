/**
 * @module typedefs
 */

/**
 * Defines a complete island blueprint.
 *
 * An island consists of:
 * - A target dimension
 * - A positional offset relative to a world origin
 * - Optional loot container data
 * - One or more block volumes to place
 *
 * @typedef {Object} IslandDef
 * @property {string} name - Human-readable island name.
 * @property {string} dimension - Dimension in which the island is generated.
 * @property {import("@minecraft/server").Vector3} origin_offset - Offset applied to the world origin to resolve the island's local origin.
 * @property {LootDef=} loot - Optional loot container definition.
 * @property {VolumeDef[]} blocks - List of block volume definitions to build.
 */

/**
 * Defines a loot container and its contents.
 *
 * @typedef {Object} LootDef
 * @property {import("@minecraft/server").Vector3} containerLoc - Offset from island origin where the loot container block is placed.
 * @property {Loot[]} items - List of loot entries to insert into the container.
 */

/**
 * Defines a single loot entry inside a container.
 *
 * @typedef {Object} Loot
 * @property {number} slot - Inventory slot index to place the item into.
 * @property {string} item - Minecraft item identifier.
 * @property {number} amount - Stack size of the item.
 */

/**
 * Defines a rectangular volume of blocks to be placed.
 *
 * @typedef {Object} VolumeDef
 * @property {string} blockId - Minecraft block identifier to fill the volume with.
 * @property {PermDef[]=} perms - Optional block permutation data to apply after placement.
 * @property {Offset} offset - Relative coordinate range defining the volume.
 */

/**
 * Defines a block permutation override.
 *
 * Used to apply block state values (e.g. direction, face bits)
 * after the block is placed.
 *
 * @typedef {Object} PermDef
 * @property {string} id - Block permutation property identifier.
 * @property {string|boolean|number} value - Value assigned to the permutation.
 */

/**
 * Defines a 3D coordinate range relative to an island origin.
 *
 * Both `from` and `to` are inclusive and may be specified
 * in any order (normalization handled by BlockVolume).
 *
 * @typedef {Object} Offset
 * @property {import("@minecraft/server").Vector3} from - Starting corner offset.
 * @property {import("@minecraft/server").Vector3} to - Ending corner offset.
 */

/**
 * Configuration for an entity to be summoned as a side effect of a successful
 * block replacement.
 *
 * @typedef {Object} EntityConfig
 * @property {string} id - Identifier of the entity to summon.
 * @property {import("@minecraft/server").Vector3=} offset - Optional offset applied relative to the replaced block's location. Defaults to the block's exact position if omitted.
 * @property {string[]} spawnEvents - List of entity spawn events to trigger immediately after summoning.
 */

/**
 * Configuration describing how a discovered block should be replaced and
 * what additional effects should occur on success.
 *
 * @typedef {Object} ReplacementConfig
 * @property {BiomeFilter=} biomeFilter - Optional biome filter used for early rejection before attempting block replacement.
 * @property {string} replaceWithBlock - Block identifier to place when a target block is replaced.
 * @property {PermDef[]=} permutations - Optional permutation data applied to the placed block.
 * @property {EntityConfig=} summonEntity - Optional entity summon configuration executed after a successful block replacement.
 * @property {string=} sound - Optional sound identifier to play at the player location when the block is successfully replaced.
 */

/**
 * Filter definition used to constrain searches or replacements to a specific biome.
 *
 * @typedef {Object} BiomeFilter
 * @property {string} biomeId - Identifier of the biome to match against.
 * @property {import("@minecraft/common").NumberRange|number} bounds - Vertical search bounds used when checking for the biome. A single number is treated as a fixed Y-level.
 */

export {};
