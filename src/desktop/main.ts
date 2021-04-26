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

import { app, BrowserWindow, ipcMain, Menu, Notification, Tray } from "electron";
import path from "path";

const name: string = "Desktop Flick";
const port: number = 7272;
const icon: string = path.join(__dirname, "../icon.ico");

const darwin: boolean = process.platform === "darwin";

abstract class Main {

    private static window: BrowserWindow;
    private static tray: Tray;

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
                }
            );
    }

}

process.on("unhandledRejection", (reason, promise) => console.error(`Unhandled rejection at:\n  ${reason}\n  ${promise}`));

Main.main().catch(error => console.error(error.stack));