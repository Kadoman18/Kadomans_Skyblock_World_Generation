import { world } from "@minecraft/server";
import { debugMsg } from "../../utils/debugUtils";

world.afterEvents.entitySpawn.subscribe((eventData) => {
	const { entity, cause } = eventData;
	if (entity.typeId !== "minecraft:splash_potion") return;
	const source = entity.getComponent("minecraft:projectile")?.owner;
	if (source?.typeId !== "minecraft:player" || !source?.hasTag("kado:threwThickPotion")) return;
	entity.addTag("kado:isThickPotion");
	debugMsg(`Marked splash potion ${entity.id} as Thick Potion`);
});
