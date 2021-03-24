// Copyright (C) 2021 Avery
// 
// This file is part of weasel.
// 
// weasel is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// weasel is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with weasel.  If not, see <http://www.gnu.org/licenses/>.

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
    player.terminateIfUnidentifiedTimeout().then(() => {
        // Valid identification
        player.setupHeartbeatInterval();
    }).catch(() => {
        player.terminate("Did not identify in time");
    });
});
