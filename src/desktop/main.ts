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

    const url: string = "http://" + ip + ':' + port;

    require("qrcode").toDataURL(url, {margin: 0, width: 150}, (err: Error, qr_base64: string) => {
        // authentication window
        let auth = window = new BrowserWindow({
            width: 300,
            height: 450,
            minWidth: 300,
            minHeight: 450,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                enableRemoteModule: false,
                devTools: false, // disable dev tools
                preload: path.join(__dirname, "interface.js")
            }
        });
        auth.removeMenu();
        auth.setTitle("DesktopFlick Pairing")
        auth.loadFile(path.join(__dirname, "auth.html"));
        auth.once("ready-to-show", () => {
            auth.webContents.send("init", {qr: qr_base64, url: url})
            auth.show();
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

            const url: string = req.url || "";
            const authenticated: string = lockedConn && lockedConn === ip ? "true" : "false";

            if(url === "/"){
                auth.webContents.send("readyCode");

                // generate code
                if(!(ip in codes)){
                    let code;
                    do{
                        code = generateCode(4);
                    }while(code in codes.values)
                    codes.set(ip, code);
                }
                let code: string = codes.get(ip) || "";

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(mobileIndex.replace("{{ code }}", code).replace("{{ login }}", authenticated));
            }else if(url === "/mobile.css"){
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(mobileCSS);
            }else if(url === "/mobile.css.map"){
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(mobileCSSmap);
            }else if(url === "/mobile.js"){
                res.writeHead(200, { 'Content-Type': 'text/javascript' });
                res.end(mobileJS);
            }else if(url === "/event"){
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });
                return setInterval(() => {
                    res.write(`retry: ${refresh}\nid: ${Date.now()}\ndata: ${authenticated}\n\n`);
                }, refresh);
            }else if(url === "/input" && authenticated){

            }
            return;
        });

        // code handler
        {
            ipcMain.on("code", (e: Electron.IpcMainEvent, args: string) => {
                if(lockedConn) return; // already paired
                const code = args.toUpperCase();

                for(let [k, v] of codes.entries()){
                    if(code === v){
                        lockedConn == k;
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

const codeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCode(length: number){
    let result = "";
    for(let i = 0; i < length; i++)
        result += codeChars.charAt(Math.floor(Math.random() * 36));
    return result;
}

function launch(): void {
    console.log("opened!");

    window.loadFile(path.join(__dirname, "index.html"));
}

main();