//  --------------------------------------------------
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
// Island schema overview:
// --------------------------------------------------
/*
{
        name: string,
        dimension: string,
        origin_offset?: Vector3, // Offset from world spawn
        loot?: {
                containerLoc: Vector3, // Offset from island origin
                items: [
                        {
                                slot: number,
                                item: string,
                                amount: number
                        }
                ]
        },
        blocks: [
                {
                        blockId: string,
                        perms?: [
                                {
                                        perm: string,
                                        value: any
                                }
                        ],
                        offset: {
                                from: Vector3,
                                to: Vector3
                        }
                }
        ]
}

NOTES:
- All offsets are relative to island.origin_offset
- from/to order does not matter; BlockVolume normalizes bounds
*/

// --------------------------------------------------
// Island Registries
// --------------------------------------------------
/**@type {import("../utils/typedefs").IslandDef[]} */
const overworldIslands = [
	{
		name: "Starter Island",
		dimension: "overworld",
		origin_offset: { x: 0, y: 0, z: 0 },
		loot: {
			containerLoc: { x: 0, y: 0, z: 4 },
			items: [
				{ slot: 11, item: "minecraft:ice", amount: 1 },
				{ slot: 15, item: "minecraft:lava_bucket", amount: 1 },
			],
		},
		blocks: [
			{
				blockId: "minecraft:oak_leaves",
				offset: { from: { x: -3, y: 6, z: -1 }, to: { x: -5, y: 6, z: -1 } },
			},
			{
				blockId: "minecraft:oak_leaves",
				offset: { from: { x: -4, y: 6, z: 0 }, to: { x: -4, y: 6, z: -2 } },
			},
			{
				blockId: "minecraft:oak_leaves",
				offset: { from: { x: -3, y: 5, z: 0 }, to: { x: -5, y: 5, z: -2 } },
			},
			{
				blockId: "minecraft:oak_leaves",
				offset: { from: { x: -2, y: 4, z: 1 }, to: { x: -6, y: 4, z: -3 } },
			},
			{
				blockId: "minecraft:oak_leaves",
				offset: { from: { x: -2, y: 3, z: 0 }, to: { x: -6, y: 3, z: -2 } },
			},
			{
				blockId: "minecraft:oak_leaves",
				offset: { from: { x: -3, y: 3, z: 1 }, to: { x: -5, y: 3, z: -3 } },
			},
			{
				blockId: "minecraft:oak_log",
				offset: { from: { x: -4, y: 5, z: -1 }, to: { x: -4, y: 0, z: -1 } },
			},
			{
				blockId: "minecraft:chest",
				perms: [{ id: "minecraft:cardinal_direction", value: "north" }],
				offset: { from: { x: 0, y: 0, z: 4 }, to: { x: 0, y: 0, z: 4 } },
			},
			{
				blockId: "minecraft:grass",
				offset: { from: { x: 1, y: -1, z: 4 }, to: { x: -4, y: -1, z: -1 } },
			},
			{
				blockId: "minecraft:dirt",
				offset: { from: { x: 1, y: -2, z: 4 }, to: { x: -4, y: -3, z: -1 } },
			},
			{
				blockId: "minecraft:air",
				offset: { from: { x: -2, y: -1, z: 4 }, to: { x: -4, y: -3, z: 2 } },
			},
			{
				blockId: "minecraft:bedrock",
				offset: { from: { x: 0, y: -3, z: 0 }, to: { x: 0, y: -3, z: 0 } },
			},
		],
	},
	{
		name: "Sand Island",
		dimension: "overworld",
		origin_offset: { x: 0, y: 0, z: -67 },
		loot: {
			containerLoc: { x: 0, y: 0, z: 0 },
			items: [
				{ slot: 9, item: "minecraft:sugar_cane", amount: 1 },
				{ slot: 11, item: "minecraft:pumpkin_seeds", amount: 1 },
				{ slot: 13, item: "minecraft:obsidian", amount: 10 },
				{ slot: 15, item: "minecraft:melon_slice", amount: 1 },
				{ slot: 17, item: "minecraft:turtle_egg", amount: 2 },
			],
		},
		blocks: [
			{
				blockId: "minecraft:chest",
				perms: [{ id: "minecraft:cardinal_direction", value: "south" }],
				offset: { from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: 0 } },
			},
			{
				blockId: "minecraft:sand",
				offset: { from: { x: -1, y: -1, z: -1 }, to: { x: 1, y: -3, z: 1 } },
			},
			{
				blockId: "kado:stable_air",
				offset: { from: { x: -1, y: -4, z: -1 }, to: { x: 1, y: -4, z: 1 } },
			},
			{
				blockId: "minecraft:cactus",
				offset: { from: { x: -1, y: 0, z: -1 }, to: { x: -1, y: 0, z: -1 } },
			},
			{
				blockId: "minecraft:cactus_flower",
				offset: { from: { x: -1, y: 1, z: -1 }, to: { x: -1, y: 1, z: -1 } },
			},
		],
	},
	{
		name: "End Initializer",
		dimension: "the_end",
		origin_offset: { x: 0, y: 0, z: 0 },
		blocks: [
			{
				blockId: "minecraft:end_stone",
				offset: { from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: 0 } },
			},
		],
	},
];

/**@type {import("../utils/typedefs").IslandDef[]} */
const netherIslands = [
	{
		name: "Nether Island",
		dimension: "nether",
		origin_offset: { x: 0, y: 0, z: 0 },
		blocks: [
			{
				blockId: "minecraft:warped_nylium",
				offset: { from: { x: -2, y: -1, z: 2 }, to: { x: -1, y: -1, z: -1 } },
			},
			{
				blockId: "minecraft:soul_sand",
				offset: { from: { x: -1, y: -1, z: 2 }, to: { x: -1, y: -1, z: 2 } },
			},
			{
				blockId: "minecraft:nether_wart",
				offset: { from: { x: -1, y: 0, z: 2 }, to: { x: -1, y: 0, z: 2 } },
			},
			{
				blockId: "minecraft:crimson_nylium",
				offset: { from: { x: 1, y: -1, z: 2 }, to: { x: 2, y: -1, z: -1 } },
			},
			{
				blockId: "minecraft:soul_sand",
				offset: { from: { x: 1, y: -1, z: -1 }, to: { x: 1, y: -1, z: -1 } },
			},
			{
				blockId: "minecraft:nether_wart",
				offset: { from: { x: 1, y: 0, z: -1 }, to: { x: 1, y: 0, z: -1 } },
			},
			{
				blockId: "minecraft:netherrack",
				offset: { from: { x: -2, y: -2, z: 2 }, to: { x: 2, y: -3, z: -1 } },
			},
		],
	},
];

/**@type {import("../utils/typedefs").IslandDef[]} */
const endIslands = [
	{
		name: "empty",
		dimension: "the_end",
		origin_offset: { x: 100, y: 50, z: 0 },
		blocks: [],
	},
];

/**
 *
 * @param {import("@minecraft/server").Dimension} dimension - Dimension to fetch island objects for.
 * @returns {import("../utils/typedefs").IslandDef[]}
 */
export function getIslands(dimension) {
	switch (dimension.id) {
		case "minecraft:overworld":
			return overworldIslands;
		case "minecraft:nether":
			return netherIslands;
		case "minecraft:the_end":
			return endIslands;
	}
}
