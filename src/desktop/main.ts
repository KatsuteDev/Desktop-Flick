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

import { app, BrowserWindow, ipcMain, Menu, Tray } from "electron";
import path from "path";
import http from "http";

let window: BrowserWindow;

const port: number = 6565;

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

function authenticateAndStart(): void {
    const inet = require("os").networkInterfaces();
    const ip: string = Object.keys(inet) // get IPv4 external
        .map(x => inet[x].filter((x: { family: string; internal: boolean; }) => x.family === "IPv4" && !x.internal)[0])
        .filter(x => x)[0].address;

    const url: string = "http://" + ip + ':' + port;

    require("qrcode").toDataURL(url, {margin: 0, width: 150}, (err: Error, qr_base64: string) => {
        // authentication window
        const auth = new BrowserWindow({
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
        auth.setAlwaysOnTop(true);
        auth.loadFile(path.join(__dirname, "auth.html"));
        auth.once("ready-to-show", () => {
            auth.webContents.send("init", {qr: qr_base64, url: url})
            auth.show();
        });

        // authentication handler
        let codeReady = false;
        const server = http.createServer((req:http.IncomingMessage, res: http.ServerResponse) => {
            const url: string = req.url || "";

            if(url === "/"){
                if(!codeReady){
                    auth.webContents.send("readyCode");
                    codeReady = true;
                }

            }else if(url === "/mobile.css"){

            }else if(url === "/mobile.css.map"){

            }else if(url === "/mobile.js"){

            }else if(url === "/event"){

            }else if(url === "/input"){

            }
            res.end();
        });

        server.listen(port);
    });
}

function launch(): void {
    
}

/*
let tray: Tray;

function createWindow(): void {
    window = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true
        }
    });
    window.loadFile("index.html");

    /* todo
    window.on("minimize", (e: Event) => {
        e.preventDefault();
        window.hide();
        window.setSkipTaskbar(true);
        tray = createTray();
    });

    window.on("restore", (e: Event) => {
        window.show();
        window.setSkipTaskbar(false);
        tray.destroy();
    });
    *//*
}

function createTray(): Tray {
    let icon:Tray = new Tray("electron.ico");
    const menu = Menu.buildFromTemplate([
        {
            label: "Show", click: () => window.show()
        },
        {
            label: "Exit", click: () => {
                app.quit();
            }
        }
    ]);

    icon.on("double-click", window.show);
    icon.setToolTip("test");
    icon.setContextMenu(menu);
    return icon;
}
*/

main();