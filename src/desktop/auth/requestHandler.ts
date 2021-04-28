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

import { EventListener } from "../eventListener";
import { Authenticator } from "./authenticator";

import { IncomingMessage, OutgoingHttpHeaders, RequestListener, ServerResponse } from "http";
import fs from "fs";
import path from "path";
import { BrowserWindow, ipcMain } from "electron";

export { RequestHandler }

const typeIcon  : OutgoingHttpHeaders = { "Content-Type": "image/x-icon" };
const typeHTML  : OutgoingHttpHeaders = { "Content-Type": "text/html" };
const typeCSS   : OutgoingHttpHeaders = { "Content-Type": "text/css" };
const typeMAP   : OutgoingHttpHeaders = { "Content-Type": "application/json" };
const typeJS    : OutgoingHttpHeaders = { "Content-Type": "text/javascript" };
const typeEvent : OutgoingHttpHeaders = {
                                            "Content-Type": "text/event-stream",
                                            "Cache-Control": "no-cache",
                                            "Connection": "keep-alive"
                                        };

class RequestHandler extends EventListener {

    private lockedIP: string | undefined;
    private readonly codes: Map<string,string> = new Map();

    private static readonly icon: string = path.join(__dirname, "../../", "icon.ico");

    private static readonly html    : string = fs.readFileSync(path.join(__dirname, "../../", "mobile", "index.html"), "utf-8");
    private static readonly css     : string = fs.readFileSync(path.join(__dirname, "../../", "mobile", "index.css"), "utf-8");
    private static readonly cssmap  : string = fs.readFileSync(path.join(__dirname, "../../", "mobile", "index.css.map"), "utf-8");
    private static readonly js      : string = fs.readFileSync(path.join(__dirname, "../../", "mobile", "index.js"), "utf-8");

    private readonly appname: string;
    private readonly window: BrowserWindow;

    constructor(appname: string, window: BrowserWindow){
        super();
        this.appname = appname;
        this.window = window;

        ipcMain.on("code", (event: Electron.IpcMainEvent, ...args: any[]) => {
            if(this.lockedIP) return; // already paired
            const code: string = (args[0] as string).toUpperCase();

            for(let [k, v] of this.codes.entries())
                if(code == v){
                    this.lockedIP = k;
                    this.handle("authenticated", code);
                    ipcMain.removeAllListeners("code");
                    return;
                }
        });
    }

    public readonly handler: RequestListener = (req: IncomingMessage, res: ServerResponse) => {
        const ip: string = req.socket.remoteAddress || "";

        // deny new conn if one already exists
        if(this.lockedIP && ip !== this.lockedIP){
            res.writeHead(401, { "Content-Type": 'text/html' });
            res.end("connection denied by server");
            return;
        }

        const authorized: boolean = this.authenticated(ip);

        const p: string = req.url || "";

        if(p == '/'){
            this.window.webContents.send("show");
            if(!this.codes.has(ip)){
                let code: string;
                do{}
                while((code = Authenticator.generateCode(4)) in this.codes.values);
                this.codes.set(ip, code);
            }
            const code: string = this.codes.get(ip)!;
            res.writeHead(200, typeHTML);
            res.end(RequestHandler.html
                .replace("{{ title }}", `${this.appname} Pairing`)
                .replace("{{ code }}", code)
                .replace("{{ login }}", authorized ? "true" : "false")
            );
        }else if(p == "/favicon.ico"){
            res.writeHead(200, typeIcon);
            fs.createReadStream(RequestHandler.icon).pipe(res);
        }else if(p == "/index.css"){
            res.writeHead(200, typeCSS);
            res.end(RequestHandler.css);
        }else if(p == "/index.css.map"){
            res.writeHead(200, typeMAP);
            res.end(RequestHandler.cssmap);
        }else if(p == "/index.js"){
            res.writeHead(200, typeJS);
            res.end(RequestHandler.js);
        }else if(p == "/event"){
            res.writeHead(200, typeEvent);
            return setInterval(() => {
                res.write(`retry: ${10}\nid: ${Date.now()}\ndata: ${this.authenticated(ip)}\n\n`);
            }, 10);
        }else if(p.startsWith("/input?") && authorized){
            const query: Map<string, string | null> = RequestHandler.parseQuery(p.substr(p.indexOf('?') + 1));
            this.handle("input", query.get("q") || "");
        }else if(p.startsWith("/submit") && authorized){
            this.handle("submit");
        }else{
            res.end();
        }
    };

    private authenticated(ip: string): boolean {
        return !!this.lockedIP && this.lockedIP == ip;
    }

    //

    private static parseQuery(raw: string): Map<string, string | null> {
        const OUT: Map<string, string | null> = new Map();
        const pairs: string[] = raw.split('&');
        for(const pair of pairs){
            if(pair.includes('=')){
                const kv: string[] = pair.split('=');
                OUT.set(
                    decodeURIComponent(kv![0]),
                    kv.length == 2 ? decodeURIComponent(kv![1]) : null
                );
            }
        }
        return OUT;
    }

}
