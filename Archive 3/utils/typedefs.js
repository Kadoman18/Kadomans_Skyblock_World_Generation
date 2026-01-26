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
 * @property {Vector3} origin_offset - Offset applied to the world origin to resolve the island's local origin.
 * @property {LootDef|undefined} loot - Optional loot container definition.
 * @property {VolumeDef[]} blocks - List of block volume definitions to build.
 */

/**
 * Defines a loot container and its contents.
 *
 * @typedef {Object} LootDef
 * @property {Vector3} containerLoc - Offset from island origin where the loot container block is placed.
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
 * @property {PermDef|undefined} perms - Optional block permutation data to apply after placement.
 * @property {Offset} offset - Relative coordinate range defining the volume.
 */

/**
 * Defines a block permutation override.
 *
 * Used to apply block state values (e.g. direction, face bits)
 * after the block is placed.
 *
 * @typedef {Object} PermDef
 * @property {string|undefined} perm - Block permutation property identifier.
 * @property {string|boolean|number|undefined} value - Value assigned to the permutation.
 */

/**
 * Defines a 3D coordinate range relative to an island origin.
 *
 * Both `from` and `to` are inclusive and may be specified
 * in any order (normalization handled by BlockVolume).
 *
 * @typedef {Object} Offset
 * @property {Vector3} from - Starting corner offset.
 * @property {Vector3} to - Ending corner offset.
 */

/**
 * Describes a range of numbers from min to max.
 *
 * @typedef {Object} NumberRange
 * @prop {number} max - The maximum value
 * @prop {number} min - The minimum value
 */

export {};
