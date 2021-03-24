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

export enum OPCodes {
    HELLO,
    IDENTIFY,
    IDENTIFY_ACK,
    IDENTIFY_REQUIRED,
    IDENTIFY_PARTY_PASSCODE_REQ,
    SET_PASSCODE,
    SET_PASSCODE_ACK,
    HEARTBEAT,
    HEARTBEAT_ACK,
    ADD_DATA,
    ADD_DATA_ACK,
    REMOVE_DATA,
    REMOVE_DATA_ACK,
    GET_DATA,
    GET_DATA_ACK,
    MESSAGE,
    ANNOUNCEMENT,
    TERMINATE,

    // All party
    PARTY_USER_ADD,
    PARTY_USER_LEAVE
};