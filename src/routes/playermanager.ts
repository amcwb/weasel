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

import deepmerge from "deepmerge";
import WebSocket from "ws";
import { OPCodes } from "./opcodes";
import { PartyManager } from "./partymanager";


export interface Data {
    [name: string]: object
}

export interface IncomingData {
    op: OPCodes,
    name?: string,
    party_uuid?: string,
    party_passcode?: number,
    data?: Data
}

export interface PlayerData {
    ws: WebSocket,
    name: string,
    party?: string,
    heartbeat?: number,
    partyManager: PartyManager,
}

export class PlayerHandler {
    ws: WebSocket;
    name: string;
    party: string;
    heartbeat: number;
    identified: boolean;
    lastHeartbeat: number;
    partyManager: PartyManager;

    private heartbeatInterval?: NodeJS.Timeout;
    private identificationTimeout?: NodeJS.Timeout;
    constructor(options: PlayerData) {
        this.ws = options.ws;
        this.name = options.name;
        this.party = options.party;
        this.heartbeat = options.heartbeat ?? 5000;

        this.identified = false;
        this.lastHeartbeat = Date.now();
        this.partyManager = options.partyManager;
    }

    /**
     * Greet the client, and send them the heartbeat.
     */
    hello() {
        this.send(OPCodes.HELLO, {
            heartbeat: this.heartbeat
        });
    }

    /**
     * Send the opcode TERMINATE along with a reason before terminating the
     * connection.
     * @param reason The reason for the termination
     */
    terminate(reason: string) {
        clearInterval(this.heartbeatInterval);
        this.send(OPCodes.TERMINATE, { reason });
        this.ws.close();
    }

    /**
     * Add onMessage and onClose hooks.
     */
    setupHooks() {
        this.ws.on("message", (message) => { this.onMessage(message) });
        this.ws.on("close", () => { this.onClose() });
    }

    /**
     * Setup an interval to ensure the client keeps up with the heartbeat.
     *
     * If the heartbeat is not met, the user is abruptly disconnected.
     * @returns The heartbeat interval
     */
    setupHeartbeatInterval() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (Date.now() - this.lastHeartbeat > this.heartbeat) {
                this.terminate(`Heartbeat due at ${this.lastHeartbeat+this.heartbeat} was missed`);
            }
        })

        return this.heartbeatInterval;
    }

    /**
     * Wait `delay` milliseconds, and if the user is not identified, throw
     * an error. Otherwise, resolve.
     * 
     * This being a promise allows more customizable responses.
     * @param delay The delay to wait. By default the same as heartbeat
     * @returns The promise for the timeout
     */
    terminateIfUnidentifiedTimeout(delay?: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.identificationTimeout = setTimeout(() => {
                if (!this.identified) {
                    reject("Did not identify in time");
                } else {
                    resolve();
                }
            }, delay ?? this.heartbeat);
        });
    }

    /**
     * Handles the incoming messages and performs the correct method based
     * on the opcode.
     * @param rawMessage Raw data from webhook
     */
    onMessage(rawMessage: WebSocket.Data) {
        const data: IncomingData = JSON.parse(rawMessage.toString());
        switch (data.op) {
            case OPCodes.HEARTBEAT:
                this.onHeartbeat(data);
                break;

            case OPCodes.IDENTIFY:
                this.onIdentify(data);
                break;

            case OPCodes.ADD_DATA:
                this.onAddData(data);
                break;

            default:
                break;
        }
    }

    /**
     * Handle heartbeat
     * @param data Incoming data
     */
    onHeartbeat(data: IncomingData) {
        this.lastHeartbeat = Date.now();
        this.send(OPCodes.HEARTBEAT_ACK, { next: this.lastHeartbeat + this.heartbeat });
    }

    /**
     * Handles identification & validation
     * @param data Incoming data
     */
    onIdentify(data: IncomingData) {
        const name = data.name;
        const party_uuid = data.party_uuid;
        const party_passcode = data.party_passcode;

        if (name === undefined || party_uuid === undefined) {
            return this.terminate("Identification invalid");
        }

        if (!this.partyManager.has(party_uuid)) {
            return this.terminate("Party does not exist");
        }

        const party = this.partyManager.get(party_uuid);
        if (party.passcode !== undefined && party.passcode !== party_passcode) {
            return this.terminate("Party code invalid");
        }

        party.players.push(this);
        this.party = party_uuid;
        this.identified = true;

        this.send(OPCodes.IDENTIFY_ACK);
    }

    /**
     * Handle when the user requsts to add data. This deepmerges
     * @param data Incoming data
     */
    onAddData(data: IncomingData) {
        const fieldData = data.data;
        deepmerge(this.getParty()?.data, fieldData);

        this.send(OPCodes.ADD_DATA_ACK, { data: this.getParty()?.data });
    }

    /**
     * Performs closing operations
     */
    onClose() {
        // Don't assume the party exists. The party ending could be the cause
        // of the close.
        this.getParty()?.players?.filter(player => player !== this);
    }

    /**
     * Get the party from the user's party manager
     * @returns The party from the party manager
     */
    getParty() {
        return this.partyManager.get(this.party);
    }

    /**
     * Send data to user via webhook with opcode.
     *
     * The operator name is sent along with it, alongside any extra
     * data provided to this function.
     * @param op Operator to use
     * @param data Data to send alongside
     */
    send(op: OPCodes, data?: object) {
        this.ws.send(JSON.stringify(
            {
                op,
                opname: OPCodes[op],
                ...data
            }
        ))
    }
}