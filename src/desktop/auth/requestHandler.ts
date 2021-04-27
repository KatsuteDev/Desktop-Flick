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

import { IncomingMessage, RequestListener, ServerResponse } from "http";
import { EventListener } from "../eventListener";
import { Authenticator } from "./auth";

export { RequestHandler }

class RequestHandler extends EventListener {

    private lockedIP: string | undefined;
    private codes: Map<string,string> = new Map();

    constructor(){
        super();
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

        const path: string = req.url || "";

        if(path == '/'){
            if(!this.codes.has(ip)){
                let code: string;
                do{}
                while((code = Authenticator.generateCode(4)) in this.codes.values);
                this.codes.set(ip, code);
            }
        }else if(path == "/event"){
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            });
            return setInterval(() => {
                res.write(
                    `retry: ${10}
                    id: ${Date.now()}
                    data: ${this.authenticated(ip)}\n\n`
                );
            }, 10);
        }else if(path.startsWith("/input?") && authorized){
            const query: Map<string, string | null> = RequestHandler.parseQuery(path.substr(path.indexOf('?') + 1));
            this.handle("input", query.get("q") || "");
        }else if(path.startsWith("/submit") && authorized){
            this.handle("submit");
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
