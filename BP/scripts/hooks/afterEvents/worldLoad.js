import { world, system } from "@minecraft/server";
import { scriptWorldGen } from "../../loops/scriptWorldGen";
import { processAmethystBuds } from "../../loops/amethystBudLoop";
import { worldInitializer } from "../../loops/worldInitializer";

world.afterEvents.worldLoad.subscribe(() => {
	let initialized = false;
	const initInterval = system.runInterval(() => {
		if (worldInitializer()) {
			initialized = true;
			system.clearRun(initInterval);
		}
	}, 5);
	system.runInterval(() => {
		scriptWorldGen(initialized);
	}, 20);
	system.runTimeout(() => {
		system.runInterval(() => {
			processAmethystBuds(initialized);
		}, 20);
	}, 10);
});
