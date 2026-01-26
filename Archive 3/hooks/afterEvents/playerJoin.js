import { world, system } from "@minecraft/server";
import { registerPlayer, playerInfoMaps } from "../../cache/playersCache";
import { debugMsg } from "../../utils/debugUtils";

world.afterEvents.playerJoin.subscribe((eventData) => {
	const { playerId, playerName } = eventData;
	// Player object is not available yet — wait 1 tick
	system.run(() => {
		const player = world.getAllPlayers().find((p) => p.id === playerId);
		if (!player) return;
		registerPlayer(player);
		debugMsg(`${playerName} joined. Registry size: ${playerInfoMaps.size}`);
	});
});
