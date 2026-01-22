import { world } from "@minecraft/server";
import { playerInfoMaps } from "../../cache/playersCache";
import { debugMsg } from "../../utils/debugUtils";

world.afterEvents.playerLeave.subscribe((eventData) => {
	const { playerId, playerName } = eventData;
	if (playerInfoMaps.delete(playerId)) {
		debugMsg(`${playerName} left. Registry size: ${playerInfoMaps.size}`);
	}
});
