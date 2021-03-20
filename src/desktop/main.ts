/*
    Copyright (C) 2021 Katsute
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import { app, BrowserWindow, ipcMain } from "electron";
import clipboardy from "clipboardy";
import robot from "robotjs";
import path from "path";
import http from "http";
import fs from "fs";

let window: BrowserWindow;

function main(): void {
    // exit if another instance exists
    if(!app.requestSingleInstanceLock()){
        app.quit();
        return;
    }else{
        // refocus if existing instance, otherwise create new instance
        app.on("second-instance", () => {
            if(window){
                if(window.isMinimized())
                    window.restore();
                window.focus();
            }
        });

        app.whenReady().then(authenticateAndStart);
    }

}

const port: number = 6565;
const refresh: number = 1000;
let mobileIndex: string, mobileCSS: string, mobileCSSmap: string, mobileJS: string;

/* init files */ {
    fs.readFile(path.join(__dirname, "../mobile/index.html"), "utf8", (err, data: string) => {
        mobileIndex = data;
    });

    fs.readFile(path.join(__dirname, "../mobile/mobile.css"), "utf8", (err, data: string) => {
        mobileCSS = data;
    });

    fs.readFile(path.join(__dirname, "../mobile/mobile.css.map"), "utf8", (err, data: string) => {
        mobileCSSmap = data;
    });

    fs.readFile(path.join(__dirname, "../mobile/mobile.js"), "utf8", (err, data: string) => {
        mobileJS = data;
    });
}

let server: http.Server;

function authenticateAndStart(): void {
    const inet = require("os").networkInterfaces();
    const ip: string = Object.keys(inet) // get IPv4 external
        .map(x => inet[x].filter((x: { family: string; internal: boolean; }) => x.family === "IPv4" && !x.internal)[0])
        .filter(x => x)[0].address;

    const sevurl: string = "http://" + ip + ':' + port;

    require("qrcode").toDataURL(sevurl, {margin: 0, width: 150}, (err: Error, qr_base64: string) => {
        // authentication window
        window = new BrowserWindow({
            width: 300,
            height: 450,
            minWidth: 250,
            minHeight: 100,
            useContentSize: true, // fix min
            center: true, // fix resize black border
            resizable: false,
            maximizable: false,
            title: "DesktopFlick Pairing",
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                enableRemoteModule: false,
                devTools: false, // disable dev tools
                preload: path.join(__dirname, "interface.js")
            },
            show: false
        });
        window.removeMenu(); // also disable dev tools
        window.loadFile(path.join(__dirname, "auth.html"));
        window.once("ready-to-show", () => {
            window.webContents.send("init", {qr: qr_base64, url: sevurl});
            window.show();
        });

        // authentication handler
        let lockedConn: string | null;
        let codes: Map<string,string> = new Map();
        server = http.createServer((req:http.IncomingMessage, res: http.ServerResponse) => {
            const ip: string = req.socket.remoteAddress || "";

            // deny conn if already paired
            if(lockedConn && lockedConn != ip){
                res.writeHead(401, { 'Content-Type': 'text/html' });
                res.end("connection denied by server");
                return;
            }

            const path: string = req.url || "";
            const authenticated: string = lockedConn && lockedConn === ip ? "true" : "false";

            if(path === "/"){
                window.webContents.send("readyCode");

                // generate code
                if(!codes.has(ip)){
                    let code;
                    do
                        code = Code.generate(4);
                    while(code in codes.values)
                    codes.set(ip, code);
                }
                let code: string = codes.get(ip)!;

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(mobileIndex.replace("{{ code }}", code).replace("{{ login }}", authenticated));
            }else if(path === "/mobile.css"){
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(mobileCSS);
            }else if(path === "/mobile.css.map"){
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(mobileCSSmap);
            }else if(path === "/mobile.js"){
                res.writeHead(200, { 'Content-Type': 'text/javascript' });
                res.end(mobileJS);
            }else if(path === "/event"){
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });
                return setInterval(() => {
                    res.write(`retry: ${refresh}\nid: ${Date.now()}\ndata: ${lockedConn && lockedConn === ip ? "true" : "false"}\n\n`);
                }, refresh);
            }else if(path.startsWith("/input?") && authenticated && appReady){
                const query: Map<string,string | null> = HTTP.parseQuery(path.substr(path.indexOf('?') + 1));
                const method: string | null | undefined = query.get("m");
                if(method === "update")
                    Input.preview(query.get("q") || "");
                else if(method === "submit")
                    Input.submit();
                res.end();
            }else{
                res.end();
            }
        });

        // code handler
        {
            ipcMain.on("code", (e: Electron.IpcMainEvent, args: string) => {
                if(lockedConn) return; // already paired
                const code = args.toUpperCase();

                for(let [k, v] of codes.entries()){
                    if(code === v){
                        lockedConn = k;
                        setTimeout(() => {
                            launch();
                        }, 1000);
                        ipcMain.removeAllListeners("code");
                        break;
                    }
                }
            });
        }
        server.listen(port);
    });
}

abstract class Code {

    // disallow vowels to prevent words
    private static codeChars = "BCDFGHJKLMNPQRSTVWXZ0123456789";

    public static generate(length: number): string{
        let result = "";
        for(let i = 0; i < length; i++)
            result += Code.codeChars.charAt(Math.floor(Math.random() * 30));
        return result;
    }

}

abstract class HTTP {

    public static parseQuery(raw: string): Map<string,string | null> {
        const OUT: Map<string,string | null> = new Map();
        const pairs: string[] = raw.split('&');
        for(const pair of pairs){
            pair: String;
            if(pair.includes('=')){
                const kv: string[] = pair.split('=');
                OUT.set(
                    decodeURIComponent(kv[0]),
                    kv.length == 2 ? decodeURIComponent(kv[1]) : null
                );
            }
        }
        return OUT;
    }

}

let appReady: boolean = false;
function launch(): void {
    window.hide();
    // revert auth window
    window.setResizable(true);
    window.setMaximizable(true);
    window.setSize(640, 360);
    window.setMinimumSize(250, 125);

    window.setTitle("DesktopFlick");
    window.loadFile(path.join(__dirname, "index.html"));
    setTimeout(() => {
        appReady = true;
        window.show();
    }, 1000);
}

abstract class Input {

    private static ctrl: string = process.platform === "darwin" ? "command" : "control";

    private static buffer: string = "";

    public static preview(text: string): void {
        window.webContents.send("preview", Input.buffer = text);
    }

    public static submit(): void {
        // DO NOT TRY TO SAVE CLIPBOARD TO VARIABLE: FILE COPY FILL CRASH READ
        clipboardy.writeSync(Input.buffer); // copy
        robot.keyTap('v', Input.ctrl); // paste
        Input.preview(Input.buffer = "");
        clipboardy.writeSync(""); // clear clipboard
    }

}

main();