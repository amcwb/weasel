import WebSocket from "ws";
import { OPCodes } from "./opcodes";
import deepmerge from "deepmerge";
import { Data, PlayerHandler } from "./playermanager";
import { Party } from "./party";


export class PartyManager extends Map<string, Party> {
    private partyCheckInterval: NodeJS.Timeout;
    constructor () {
        super();

        this.partyCheckInterval = setInterval(this.partyCheck, 5000)
    }

    partyCheck() {
        return;
    }
}