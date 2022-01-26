/*
 * Copyright (C) 2022 Katsute
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

import { RequestHandler } from "./requestHandler";
import { EventListener } from "../eventListener";
import { Main, dev } from "../main";

import http from "http";
import os from "os";
import path from "path";

export { Authenticator }

type inet = {

    family: string;
    internal: boolean;

}

const width: number  = 275;
const height: number = 400;

http.globalAgent.maxSockets = 100;

class Authenticator extends EventListener {

    private requestHandler?: RequestHandler;
    private server?: http.Server;

    constructor(){
        super();
    }

    public async start(appname: string, icon: string, app: App, port: number): Promise<void> {
        if(dev)
            console.warn("[!] Developer mode is enabled");

        const qr: string = await qrcode.toDataURL(
            `http://${await Authenticator.getIP()}:${port}`,
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
            fullscreenable: false,

            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                enableRemoteModule: false,
                devTools: dev,
                preload: path.join(__dirname, "../", "interface.js")
            }
        });
        if(!dev)
            window.removeMenu(); // disable dev tools
        window.loadFile(path.join(__dirname, "index.html"));
        window.once("ready-to-show",
            (event: Electron.Event, isAlwaysOnTop: boolean) => {
                window.show();
                window.webContents.send("init", {qr, url: `${Authenticator.getIP()}:${port}`});
            }
        );
        Main.setActiveWindow(window);

        // server
        this.requestHandler = new RequestHandler(appname, window);
        this.server = http.createServer(this.requestHandler.handler);

        // redirect emit handler events to authenticator
        this.requestHandler!.on("authenticated", (...argv: any[]) =>
            setTimeout(() => this.handle("authenticated", argv), 500));
        this.requestHandler!.on("input", (...argv: any[]) => this.handle("input", argv));
        this.requestHandler!.on("submit", (...argv: any[]) => this.handle("submit", argv));

        this.server.listen(port);
    }

    //

    public static getIP(): string {
        const inet: NodeJS.Dict<os.NetworkInterfaceInfo[]> = os.networkInterfaces();
        return Object
            .keys(inet)
            .map(x => inet[x]!.filter((x: inet) => x.family == "IPv4" && !x.internal)[0])
            .filter(x => x)[0].address;
    }

    // disallow vowels and select numbers to prevent words
    private static readonly codeChars: string = "BCDFGHJKLMNPQRSTVWXZ23456789";
    private static readonly len: number = Authenticator.codeChars.length;

    public static generateCode(length: number): string {
        let result: string = "";
        for(let i = 0; i < length; i++)
            result += this.codeChars.charAt(Math.floor(Math.random() * Authenticator.len));
        return result;
    }

}