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

import { app, BrowserWindow, ipcMain, Menu, Notification, Tray } from "electron";
import clipboardy from "clipboardy";
import robot from "robotjs";
import qrcode from "qrcode";
import path from "path";
import http from "http";
import fs from "fs";

const name: string = "Desktop Flick";
const DEFAULT_PORT = 7272;

abstract class Application {

    private static window: BrowserWindow; // active window

    private static aot: boolean = false; // always on top
    private static tray: Tray;

    public static main(): void {
        // exit if another instance exists
        if(!app.requestSingleInstanceLock()){
            app.quit();
            return;
        }else{
            // refocus if existing instance, otherwise create new instance
            app.on("second-instance", () => {
                if(Application.window){
                    if(Application.window.isMinimized())
                        Application.window.restore();
                    Application.window.focus();
                }
            });

            app.on('window-all-closed', () => {
                if (process.platform !== 'darwin'){
                    if(Application.tray)
                        Application.tray.destroy();
                    app.quit();
                }
            })

            app.whenReady().then(() => {
                // initialize tray
                Application.tray = new Tray(path.join(__dirname, "../../temp.ico"));
                const menu: Menu = Menu.buildFromTemplate([
                    {
                        label: "Always On Top",
                        type: "checkbox",
                        click: () => Application.window.setAlwaysOnTop(Application.aot = !Application.aot)
                    },
                    {
                        label: "Change Port",
                        type: "normal",
                        click: () => PortPopup.portPopup()
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "Quit",
                        type: "normal",
                        click: () => {
                            Main.setQuitting(true);
                            this.tray.destroy();
                            app.quit();
                        }
                    }
                ]);
                Application.tray.setToolTip(name);
                Application.tray.setContextMenu(menu);
                Application.tray.on("click", () => Application.window.show());
                // start application
                Authenticator.authenticateAndStart(DEFAULT_PORT);
            });
        }

    }

    public static isAlwaysOnTop(): boolean {
        return Application.aot;
    }

    public static setActiveWindow(window: BrowserWindow): void {
        Application.window = window;
    }

    public static getActiveWindow(): BrowserWindow {
        return Application.window;
    }

}

let mobileIndex: string, mobileCSS: string, mobileCSSmap: string, mobileJS: string;
/* init files */ {
    fs.readFile(
        path.join(__dirname, "../mobile/index.html"),
        "utf8",
        (_: NodeJS.ErrnoException | null, data: string) => {
            mobileIndex = data;
        }
    );

    fs.readFile(
        path.join(__dirname, "../mobile/mobile.css"),
        "utf8",
        (_: NodeJS.ErrnoException | null, data: string) => {
            mobileCSS = data;
        }
    );

    fs.readFile(
        path.join(__dirname, "../mobile/mobile.css.map"),
        "utf8",
        (_: NodeJS.ErrnoException | null, data: string) => {
            mobileCSSmap = data;
        }
    );

    fs.readFile(
        path.join(__dirname, "../mobile/mobile.js"),
        "utf8",
        (_: NodeJS.ErrnoException | null, data: string) => {
            mobileJS = data;
        }
    );
}

abstract class Authenticator {

    private static readonly refresh: number = 1000; // event stream refresh rate

    private static current_port: number;
    private static current_url: string;

    private static server: http.Server; // active server

    private static lockedConn: string | null;
    private static codes: Map<string,string> = new Map();

    public static authenticateAndStart(port: number): void {
        if(port === Authenticator.current_port)
            return; // skip if no change
        else if(Authenticator.server)
            Authenticator.server.close(); // if new then close existing server

        const ip: string = Authenticator.getIP();

        const sevurl: string = "http://" + ip + ':' + port;

        qrcode.toDataURL(sevurl, {margin: 0, width: 150}, (_: Error, qr_base64: string) => {
            // authentication window
            let window = Application.getActiveWindow();
            if(!window){ // initialize only once
                Application.setActiveWindow(
                    window = new BrowserWindow({
                        width: 300,
                        height: 450,
                        minWidth: 250,
                        minHeight: 100,
                        useContentSize: true, // fix min
                        center: true, // fix resize black border
                        resizable: false,
                        maximizable: false,
                        title: name + " Pairing",
                        webPreferences: {
                            nodeIntegration: true,
                            contextIsolation: true,
                            enableRemoteModule: false,
                            devTools: false, // disable dev tools
                            preload: path.join(__dirname, "interface.js")
                        },
                        show: false
                    })
                );
                window.removeMenu(); // also disable dev tools
                window.loadFile(path.join(__dirname, "auth.html"));
                window.once("ready-to-show", () => {
                    window.webContents.send("init", {qr: qr_base64, url: sevurl});
                    window.show();
                });

                // code handler
                {
                    ipcMain.on("code", (_: Electron.IpcMainEvent, args: string) => {
                        if(Authenticator.lockedConn) return; // already paired
                        const code = args.toUpperCase();

                        for(let [k, v] of Authenticator.codes.entries()){
                            if(code === v){
                                Authenticator.lockedConn = k;
                                setTimeout(() => {
                                    Main.launch();
                                }, 1000);
                                ipcMain.removeAllListeners("code");
                                break;
                            }
                        }
                    });
                }

                // init url
                Authenticator.current_url = sevurl;
            }else{
                window.webContents.send("init", {qr: qr_base64, url: sevurl}); // update url
            }

            // authentication handler
            const server: http.Server = http.createServer((req:http.IncomingMessage, res: http.ServerResponse) => {
                const ip: string = req.socket.remoteAddress || "";

                // deny conn if already paired or server is closed
                if(Authenticator.lockedConn && Authenticator.lockedConn != ip || Authenticator.current_url != sevurl){
                    res.writeHead(401, { 'Content-Type': 'text/html' });
                    res.end("connection denied by server");
                    return;
                }

                const path: string = req.url || "";
                const authenticated: string = Authenticator.lockedConn && Authenticator.lockedConn === ip ? "true" : "false";

                if(path === "/"){
                    window.webContents.send("readyCode");

                    // generate code
                    if(!Authenticator.codes.has(ip)){
                        let code: string;
                        do{}
                        while((code = Code.generate(4)) in Authenticator.codes.values);
                        Authenticator.codes.set(ip, code);
                    }
                    const code: string = Authenticator.codes.get(ip)!;

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
                        const allowed: string = Authenticator.lockedConn && Authenticator.lockedConn === ip ? "allowed" : ""; // if authenticated
                        const changed: string = Authenticator.current_url != sevurl ? "$changed: " + Authenticator.current_url : ""; // if url changed
                        res.write(`retry: ${Authenticator.refresh}\nid: ${Date.now()}\ndata: ${changed != "" ? changed : allowed}\n\n`);
                    }, Authenticator.refresh);
                }else if(path.startsWith("/input?") && authenticated && Main.isAppReady()){
                    const query: Map<string,string | null> = HTTP.parseQuery(path.substr(path.indexOf('?') + 1));
                    const method: string | null | undefined = query.get('m');
                    if(method === "update")
                        Input.preview(query.get('q') || "");
                    else if(method === "submit")
                        Input.submit();
                    res.end();
                }else{
                    res.end();
                }
            });

            server.listen(port);

            Authenticator.server = server;
            Authenticator.current_port = port
            Authenticator.current_url = sevurl;
        });
    }

    private static getIP(): string {
        const inet = require("os").networkInterfaces(); // must be require, import causes null ts issue
        return Object.keys(inet) // get IPv4 external
            .map(x => inet[x].filter((x: { family: string; internal: boolean; }) => x.family === "IPv4" && !x.internal)[0])
            .filter(x => x)[0].address;
    }

    public static getCurrentPort(): number {
        return Authenticator.current_port;
    }

    public static getCurrentURL(): string {
        return Authenticator.current_url;
    }

}

ipcMain.on("port", (_: Electron.IpcMainEvent, args: string) => {
    const port: number = parseInt(args);

    if(port >= PortPopup.MIN_PORT && port <= PortPopup.MAX_PORT)
        Authenticator.authenticateAndStart(port);

    if(PortPopup.popup)
        PortPopup.popup.destroy();
    PortPopup.popup = null;
});

abstract class PortPopup {

    private static w: number = 300;
    private static h: number = 200;

    public static readonly MIN_PORT: number = 1;
    public static readonly MAX_PORT: number = 65535;

    public static popup: BrowserWindow | null; // active popup

    public static portPopup(): void {
        if(PortPopup.popup){ // if already exists then focus
            if(PortPopup.popup.isMinimized())
                PortPopup.popup.restore();
            PortPopup.popup.focus();
            return;
        }
        const popup: BrowserWindow = PortPopup.popup = new BrowserWindow({
            width       : PortPopup.w,
            height      : PortPopup.h,
            minWidth    : PortPopup.w,
            minHeight   : PortPopup.h,
            maxWidth    : PortPopup.w,
            maxHeight   : PortPopup.h,
            useContentSize: true, // fix min
            center: true, // fix resize black border
            resizable: false,
            maximizable: false,
            title: "Change Port",
            parent: Application.getActiveWindow(),
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                enableRemoteModule: false,
                devTools: false,
                preload: path.join(__dirname, "interface.js")
            },
            show: false
        });
        popup.removeMenu();
        popup.loadFile(path.join(__dirname, "port.html"));

        popup.once("ready-to-show", () => {
            popup.webContents.send("init", Authenticator.getCurrentPort());
            popup.show();
        });

        popup.on("close", () => {
            PortPopup.popup = null;
        });
    }

}

abstract class Code {

    // disallow vowels to prevent words
    private static codeChars: string = "BCDFGHJKLMNPQRSTVWXZ0123456789";

    public static generate(length: number): string{
        let result: string = "";
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

abstract class Main {

    private static appReady: boolean = false; // tell server if app is running

    private static firstMin: boolean = true; // show notification only for first minimization

    private static quitting: boolean = false; // if quit should close instead of minimize

    public static launch(): void {
        const window: BrowserWindow = Application.getActiveWindow();
        window.hide();
        // revert auth window
        window.setResizable(true);
        window.setMaximizable(true);
        window.setSize(500, 200);
        window.setMinimumSize(300, 100);

        window.setTitle(name);
        window.loadFile(path.join(__dirname, "index.html"));

        window.on("minimize", (evt: Event) => {
            evt.preventDefault();
            window.hide();
            if(Main.firstMin)
                Main.minimizeTooltip();
        });

        window.on("close", (evt: Event) => {
            if(!Main.quitting){
                evt.preventDefault();
                window.hide();
                if(Main.firstMin)
                    Main.minimizeTooltip();
            }
            return false;
        });

        setTimeout(() => {
            Main.appReady = true;
            window.show();
            window.setAlwaysOnTop(Application.isAlwaysOnTop());

            new Notification({
                title: name,
                body: "Right click tray icon to access more options."
            }).show();
        }, 1000);
    }

    private static notification: Notification;

    private static minimizeTooltip(): void {
        Main.firstMin = false;
        Main.notification = new Notification({
            title: name,
            body: "Application has been minimized to system tray. Right click the icon to quit."
        });
        Main.notification.on("click", () => Application.getActiveWindow().show());
        Main.notification.show();
    }

    public static isAppReady(): boolean {
        return Main.appReady;
    }

    public static setQuitting(quitting: boolean = true): void{
        Main.quitting = quitting;
    }

}

abstract class Input {

    private static readonly ctrl: string = process.platform === "darwin" ? "command" : "control";

    private static buffer: string = "";

    public static preview(text: string): void {
        Application.getActiveWindow().webContents.send("preview", Input.buffer = text);
    }

    public static submit(): void {
        // DO NOT TRY TO SAVE CLIPBOARD TO VARIABLE: FILE COPY FILL CRASH READ
        clipboardy.writeSync(Input.buffer); // copy
        robot.keyTap('v', Input.ctrl); // paste
        Input.preview(Input.buffer = "");
        clipboardy.writeSync(""); // clear clipboard
    }

}

Application.main();