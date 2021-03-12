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

import { app, BrowserWindow, Menu, Tray } from 'electron';

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

        app.whenReady().then(createWindow);
    }

}

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
    */
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

main();