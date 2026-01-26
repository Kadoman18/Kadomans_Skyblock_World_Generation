import { world, ItemStack, system } from "@minecraft/server";
import { debugMsg } from "../../utils/debugUtils";

world.beforeEvents.playerBreakBlock.subscribe((eventData) => {
	const { player, block, itemStack, dimension } = eventData;
	if (player.getGameMode() !== "Survival" || itemStack?.typeId === "minecraft:shears") return;
	let doSpawn = undefined;
	const enchantable = itemStack?.getComponent("minecraft:enchantable");
	const hasSilkTouch = enchantable?.hasEnchantment("minecraft:silk_touch");
	const hasFortune = enchantable?.hasEnchantment("minecraft:fortune");
	// Fortune level (0–3)
	let fortuneLevel = 0;
	if (hasFortune) {
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
