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

Error.stackTraceLimit = Infinity;

import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";

import { Application } from "./app/app";
import { Authenticator } from "./auth/authenticator";

import path from "path";
import fs from "fs";

export { Main, dev };

const dev: boolean = false;

if(dev) console.warn("[WARN] Application in dev mode, do not distribute.");

const darwin: boolean = process.platform == "darwin";

const name: string = "Desktop Flick";
const icon: string = path.join(__dirname, "../icon.ico");
const defPort: number = 7272;

// config
const defJson: string = `{\n\t\"port\": ${defPort}\n}`;
const cpath: string =
    fs.existsSync(path.join(__dirname, "../", "src"))
    ? path.join(__dirname, "../", "../", "config.json") // dev dir
    : path.join(__dirname, "../", "../", "../", "../", "config.json"); // package

if(!fs.existsSync(cpath))
    fs.writeFileSync(cpath, defJson);

const rawJson: string = fs.readFileSync(cpath, "utf-8");
let json;
try{
    json = JSON.parse(rawJson);
}catch(e){
    json = JSON.parse(defJson);
}

const port: number = typeof json["port"] == "number" ? json["port"] : defPort;

abstract class Main {

    private static window: BrowserWindow;
    private static tray: Tray;

    private static application: Application;
    private static auth: Authenticator;

    public static async main(): Promise<void> {
        if(require("electron-squirrel-startup") || !app.requestSingleInstanceLock())
            return app.quit();

        const ip: string = `${Authenticator.getIP()}:${port}`;

        app
            .on("second-instance",
                (event: Electron.Event, argv: string[], wdir: string) => {
                    if(Main.window){
                        if(Main.window.isMinimized())
                            Main.window.restore();
                        Main.window.focus();
                    }
                }
            )
            .on("window-all-closed",
                () => {
                    if(!darwin){
                        if(Main.tray)
                            Main.tray.destroy();
                        app.quit();
                        process.exit(0);
                    }
                }
            ).once("ready",
                (event: Electron.Event, launchInfo: Record<string,any> | Electron.NotificationResponse) => {
                    Main.tray = new Tray(icon);
                    const menu: Menu = Menu.buildFromTemplate([
                        {
                            label: name,
                            type: "normal",
                            icon: nativeImage.createFromPath(icon).resize({width: 16, height: 16}),
                            enabled: false
                        },
                        {
                            label: ip,
                            type: "normal",
                            enabled: false
                        },
                        {
                            type: "separator"
                        },
                        {
                            label: "Config",
                            type: "normal",
                            click: () => require("child_process").exec(`explorer.exe /select,"${cpath}"`)
                        },
                        {
                            label: "Quit",
                            type: "normal",
                            click: () => app.quit()
                        }
                    ]);
                    Main.tray.setToolTip(name);
                    Main.tray.setContextMenu(menu);
                    Main.tray.on("click", () => Main.tray.popUpContextMenu());

                    Main.auth = new Authenticator()

                    Main.auth.on("authenticated", (...argv: any[]) => {
                        const temp: BrowserWindow = Main.window;
                        Main.window.hide();

                        this.application = new Application(Main.auth);
                        this.application.start();
                        temp.destroy();
                    });

                    Main.auth.start(name, icon, app, port);
                }
            );
    }

    public static setActiveWindow(window: BrowserWindow): void {
        Main.window = window;
    }

    public static getActiveWindow(): BrowserWindow {
        return Main.window;
    }

}

process.on("unhandledRejection", (error: Error, promise) => {
    console.error(`Unhandled rejection at:\n  Promise ${promise}\n  ${error.stack}`);
    if(app)
        app.quit();
    process.exit(-1);
});

Main.main().catch((error: Error) => {
    console.error(error.stack);
    if(app)
        app.quit();
    process.exit(-1);
});