import express from "express";
import { OPCodes } from "./opcodes";
import WebSocket from "ws";
import { v4 } from "uuid";


export interface Player {
    ws: WebSocket,
    name: string
    identified: boolean,
    last_heartbeat: number
    party: string
}

export interface Data {
    [name: string]: object
}

export interface Party {
    users: Player[],
    data: Data,
    passcode?: number
}

export interface IncomingData {
    op: OPCodes,
    name?: string,
    uuid?: string,
    passcode?: number,
    field?: string,
    data?: Data
}

const parties: Map<string, Party> = new Map();
export const router = express.Router();
const HEARTBEAT = 5000;
const prep = (object: any) => {
    object.opname = OPCodes[object.op];
    return JSON.stringify(object);
};

router.ws('/new', (ws, req) => {
    const user: Player = { ws, name: v4(), identified: false, last_heartbeat: Date.now(), party: undefined };

    ws.send(prep({
        op: OPCodes.HELLO,
        uuid: user.name
    }));
    setTimeout(() => {
        if (!user.identified) {
            ws.send(prep({
                op: OPCodes.TERMINATE,
                reason: "Did not identify after 5 seconds"
            }));

            ws.close();
        } else {
            setInterval(() => {
                if (Date.now() - user.last_heartbeat > HEARTBEAT) {
                    ws.send(prep({
                        op: OPCodes.TERMINATE,
                        reason: `Heartbeat due at ${user.last_heartbeat+HEARTBEAT} was missed`
                    }));

                    ws.close();
                }
            }, HEARTBEAT);
        }
        // Not authorised
    }, 5000);

    ws.on("message", (data) => {
        const info: IncomingData = JSON.parse(data.toString());

        // Identification is necessary
        if (!user.identified) {
            if (info.op !== OPCodes.IDENTIFY) {
                ws.send(prep({
                    op: OPCodes.IDENTIFY_REQUIRED
                }));
            } else {
                const name = info.name;
                const uuid = info.uuid;

                if (name === undefined || uuid === undefined) {
                    ws.send(prep({
                        op: OPCodes.TERMINATE,
                        reason: "Identification was invalid. Requires 'name' and 'party'."
                    }))

                    ws.close();
                } else {
                    user.name = name;

                    if (parties.has(uuid)) {
                        const party = parties.get(info.uuid);
                        if (party !== undefined) {
                            if (info.passcode === undefined || info.passcode !== party.passcode) {
                                ws.send(prep({
                                    op: OPCodes.IDENTIFY_PARTY_PASSCODE_REQ,
                                    reason: "Party requires auth"
                                }))

                                return;
                            }
                        }
                    }

                    user.party = uuid;
                    user.identified = true;

                    ws.send(prep({
                        op: OPCodes.IDENTIFY_ACK,
                        heartbeat: HEARTBEAT,
                        heartbeat_due: user.last_heartbeat + HEARTBEAT
                    }));

                }
            }
        } else {
            if (info.op === OPCodes.GET_DATA) {
                ws.send(prep({
                    op: OPCodes.GET_DATA_ACK,
                    data: parties.get(user.party).data[info.field]
                }))
            } else if (info.op === OPCodes.HEARTBEAT) {
                user.last_heartbeat = Date.now();
                ws.send(prep({
                    op: OPCodes.HEARTBEAT_ACK
                }))
            }
        }
    })
});
