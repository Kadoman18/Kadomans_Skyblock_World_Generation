import { system } from "@minecraft/server";
import { kadoVault } from "../../registry/vaultCustomComp";
import { kadoStableAir } from "../../registry/stableAirCustomComp";

system.beforeEvents.startup.subscribe((eventData) => {
	const { blockComponentRegistry, customCommandRegistry, itemComponentRegistry } = eventData;
	blockComponentRegistry.registerCustomComponent("kado:vault", kadoVault);
	blockComponentRegistry.registerCustomComponent("kado:stable_air", kadoStableAir);
});
