import { OPCodes } from "./opcodes";
import { Data, PlayerHandler } from "./playermanager";


export interface PartyOptions {
    players: PlayerHandler[],
    data: Data,
    passcode?: number
}

export class Party {
    players: PlayerHandler[];
    data: Data;
    passcode?: number;
    constructor(options: PartyOptions) {
        this.players = options.players;
        this.data = options.data;
        this.passcode = options.passcode;
    }

    send(op: OPCodes, data?: object) {
        this.players.forEach((player) => {
            player.send(op, data);
        })
    }
}

