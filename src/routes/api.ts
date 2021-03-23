import express from "express";
import { v4 } from "uuid";
import { PartyManager } from "./partymanager";
import { PlayerHandler } from "./playermanager";

export interface PlayerData {
    ws: WebSocket,
    name: string,
    party: string,
    heartbeat?: number,
    partyManager: PartyManager,
}

const partyManager: PartyManager = new PartyManager();
export const router = express.Router();

router.ws('/new', (ws, req) => {
    const player: PlayerHandler = new PlayerHandler({ ws, name: v4(), partyManager });
    player.setupHooks();

    // Require user to authenticate
    player.hello();
    player.terminateIfUnidentifiedTimeout();
});
