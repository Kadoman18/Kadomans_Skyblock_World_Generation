import { system } from "@minecraft/server";
import { kadoVault } from "../../registry/vaultCustomComp";

system.beforeEvents.startup.subscribe((eventData) => {
	const { blockComponentRegistry, customCommandRegistry, itemComponentRegistry } = eventData;
	blockComponentRegistry.registerCustomComponent("kado:vault", kadoVault);
});
