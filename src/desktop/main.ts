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

import { app, BrowserWindow, Menu, Notification, Tray } from "electron";
import path from "path";
import { Application } from "./app/app";
import { Authenticator } from "./auth/authenticator";

export { Main, dev };

const dev: boolean = false;

if(dev) console.warn("[WARN] Application in dev mode, do not distribute.");

const name: string = "Desktop Flick";
const port: number = 7272; // todo: configure this
const icon: string = path.join(__dirname, "../icon.ico");

const darwin: boolean = process.platform == "darwin";

abstract class Main {

    private static window: BrowserWindow;
    private static tray: Tray;

    private static application: Application;
    private static auth: Authenticator;

    public static async main(): Promise<void> {

        if(!app.requestSingleInstanceLock())
            return app.quit();

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
                    }
                }
            ).once("ready",
                (event: Electron.Event, launchInfo: Record<string,any> | Electron.NotificationResponse) => {
                    Main.tray = new Tray(icon);
                    const menu: Menu = Menu.buildFromTemplate([
                        {
                            label: "Quit",
                            type: "normal",
                            click: () => app.quit()
                        }
                    ]);
                    Main.tray.setToolTip(name);
                    Main.tray.setContextMenu(menu);

                    Main.auth = new Authenticator()

                    Main.auth.on("authenticated", (...argv: any[]) => {
                        const temp: BrowserWindow = Main.window;
                        Main.window.hide();

                        this.application = new Application(Main.auth);
                        this.application.start();
                        temp.destroy();

                        Main.window.once("ready-to-show",
                            (event: Electron.Event, isAlwaysOnTop: boolean) => {
                                new Notification({
                                    title: name,
                                    body: "Desktop Flick is now running. Right click the tray icon to quit.",
                                    icon: icon
                                }).show();
                            }
                        );
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
});

Main.main().catch((error: Error) => {
    console.error(error.stack);
    if(app)
        app.quit();
});