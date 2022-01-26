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

import { clipboard, Key, keyboard, mouse, Point } from "@nut-tree/nut-js";
import { app, BrowserWindow, ipcMain, screen } from "electron";

import { Authenticator } from "../auth/authenticator";
import { Handler } from "../eventListener";
import { Main, dev } from "../main";

import path from "path";

export { Application };

type Position = {

    x: number;
    y: number;

}

type Bounds = {

    top: number;
    left: number;
    right: number;
    bottom: number;

}

const buffer: number = 20;
const cursor: number = 15;

app.on("ready", () => {
    Application.bounds = {
        top: buffer,
        left: buffer,
        right: screen.getPrimaryDisplay().workAreaSize.width - buffer,
        bottom: screen.getPrimaryDisplay().workAreaSize.height - buffer
    };
});

class Application {

    static bounds: Bounds;

    private window?: BrowserWindow;
    private readonly authenticator: Authenticator;

    constructor(authenticator: Authenticator){
        this.authenticator = authenticator;
    }

    public start(): void {
        this.window = new BrowserWindow({
            alwaysOnTop: true,
            hasShadow: false,
            show: false,

            width: 0,
            height: 0,
            frame: false,
            focusable: dev,
            skipTaskbar: true,

            useContentSize: false,
            resizable: false,
            maximizable: false,
            fullscreenable: false,

            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                enableRemoteModule: false,
                devTools: dev,
                preload: path.join(__dirname, "../", "interface.js")
            }
        });
        if(!dev)
            this.window.removeMenu();

        this.window.loadFile(path.join(__dirname, "index.html"));

        ipcMain.on("size", (event: Electron.IpcMainEvent, ...args: any[]) => {
            this.window!.setMinimumSize(args[0].w, args[0].h); // electron defect #15560
            this.window!.setSize(args[0].w, args[0].h);
            this.adjustPosition(this.window!);
        });

        this.window!.once("ready-to-show",
            (event: Electron.Event, isAlwaysOnTop: boolean) => {
                this.authenticator.on("input", this.handleInput);
                this.authenticator.on("submit", this.handleSubmit);
                setInterval((...args: any[]) => this.adjustPosition(this.window!), 50);
            }
        );
        Main.setActiveWindow(this.window);
    }

    private buffer: string = "";

    private readonly handleInput: Handler = (...argv: any[]) => {
        if(this.window!.isDestroyed()) return;

        this.buffer = argv[0] ? argv[0] as string : "";

        this.window!.webContents.send("input", this.buffer);

        const visible: boolean = this.window!.isVisible();

        if(this.buffer != "" && !visible)
            this.window!.show();
        else if(this.buffer == "" && visible)
            this.window!.hide();
    };

    private readonly handleSubmit: Handler = (...argv: any[]) => {
        this.window!.hide();
        this.window!.webContents.send("input", "");
        if(this.buffer != "")
            clipboard // weird node defect ↓
                .copy(this.buffer.toString())
                .then(() => keyboard.pressKey(Key.LeftControl, Key.V))
                .then(() => keyboard.releaseKey(Key.LeftControl, Key.V))
                .then(() => clipboard.copy(this.buffer = ""));
    };

    private adjustPosition(window: BrowserWindow): void {
        if(!window.isDestroyed() && window.isVisible())
            mouse
                .getPosition()
                .then((point: Point) => this.getPreferredPosition(point, window))
                .then((pos: Position) => {
                    const p: number[] = window.getPosition();
                    if(p[0] != pos.x || p[1] != pos.y)
                        window.setPosition(pos.x, pos.y);
                });
    }

    private async getPreferredPosition(point: Point, window: BrowserWindow): Promise<Position> {
        if(!Application.bounds) return point;

        const size: number[] = window.getSize();
        const x: number = point.x + cursor;
        const y: number = point.y;
        const w: number = size[0];
        const h: number = size[1];

        const npos: Position = {x, y};

        if(x < Application.bounds.left)
            npos.x = Application.bounds.left;
        else if(x + w > Application.bounds.right)
            npos.x = Math.min(x - cursor, Application.bounds.right) - w;
        if(y < Application.bounds.top)
            npos.y = Application.bounds.top;
        else if(y + h > Application.bounds.bottom)
            npos.y = Math.min(y, Application.bounds.bottom) - h;
        return npos;
    }

}