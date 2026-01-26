import { world } from "@minecraft/server";
import { debugMsg } from "../../utils/debugUtils";

world.afterEvents.itemUse.subscribe((eventData) => {
	const { source, itemStack } = eventData;
	if (
		source.typeId !== "minecraft:player" ||
		itemStack.typeId !== "minecraft:splash_potion" ||
		itemStack.localizationKey !== "%potion.thick.splash.name"
	)
		return;
	source.addTag("kado:threwThickPotion");
	debugMsg(`${source.name} threw a Thick Splash Potion`);
});
