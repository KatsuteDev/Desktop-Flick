/*
 * Copyright (C) 2021 Katsute
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import { App, BrowserWindow } from "electron";
import qrcode from "qrcode";

import os from "os";
import http from "http";
import { RequestHandler } from "./requestHandler";
import { EventListener } from "../eventListener";

export { Authenticator }

type inet = {

    family: string;
    internal: boolean;

}

const dev: boolean = true;

const width: number  = 300;
const height: number = 450;

class Authenticator extends EventListener {

    private readonly port: number;

    constructor(port: number){
        super();
        this.port = port;
    }

    public async start(appname: string, icon: string, app: App, port: number): Promise<void> {
        if(dev)
            console.warn("Developer mode is enabled");

        const qr: string = await qrcode.toDataURL(
            `http://${await Authenticator.getIP()}:${this.port}`,
            {
                margin: 0,
                width: 150
            }
        );

        // initialize window

        const window: BrowserWindow = new BrowserWindow({
            title: `${appname} Pairing`,
            icon,
            show: false,
            width,
            height,
            minWidth: width,
            minHeight: height,
            resizable: false,
            maximizable: false,
            useContentSize: true, // fix minimum size
            center: true, // fix black resize border
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                enableRemoteModule: true,
                devTools: dev
            }
        });
        if(!dev)
            window.removeMenu(); // disable dev tools

        // server
        const server: http.Server = http.createServer(new RequestHandler().handler);
        server.listen(port);
    }

    //

    public static getIP(): string {
        const inet: NodeJS.Dict<os.NetworkInterfaceInfo[]> = os.networkInterfaces();
        return Object
            .keys(inet)
            .map(x => inet[x]!.filter((x: inet) => x.family === "IPv4" && !x.internal)[0])
            .filter(x => x)[0].address;
    }

    // disallow vowels to prevent words
    private static readonly codeChars: string = "BCDFGHJKLMNPQRSTVWXZ0123456789";

    public static generateCode(length: number): string {
        let result: string = "";
        for(let i = 0; i < length; i++)
            result += this.codeChars.charAt(Math.floor(Math.random() * 30));
        return result;
    }

}