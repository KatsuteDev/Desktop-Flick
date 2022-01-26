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

(window as any).api.receive("init", (data: any) => {
    (document.getElementById("qr") as HTMLImageElement).src = data.qr;
    document.getElementById("url")!.innerHTML = data.url;
});

(window as any).api.receive("show", (data: any) => {
    document.getElementById("code")!.classList.remove("hidden");
});

const cinput: HTMLInputElement = document.getElementById("code-input") as HTMLInputElement;
const mask: RegExp = /[^a-zA-Z0-9]+/g;

cinput.oninput = () => {
    cinput.value = cinput.value.replace(mask, ""); // remove invalid
    if(cinput.value.length == 4)
        pushCode();
}

cinput.onkeydown = (e: KeyboardEvent) => {
    if(e.key == "Enter" && cinput.value.length == 4)
        pushCode();
}

function pushCode(): void {
    (window as any).api.send("code", cinput.value);
}