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

const input: HTMLInputElement = document.getElementById("text-input") as HTMLInputElement;

// lock input
input.onblur = () => input.focus();
input.focus();

// display input
input.oninput = () => {
    const value: string = input.value || "";
    const request: XMLHttpRequest = new XMLHttpRequest();
    request.open("GET", "input?m=update&q=" + encodeURIComponent(value), true);
    request.send(null);
}

// push input
input.onkeydown = (e:KeyboardEvent) => {
    if(e.key == "Enter"){
        const request: XMLHttpRequest = new XMLHttpRequest();
        request.open("GET", "input?m=submit", true);
        request.send(null);
        input.value = "";
    }
}
// event stream
const stream: EventSource = new EventSource("event");
stream.onmessage = function(event: MessageEvent): void {
    if(event.data === "true")
        showInput();
}

function showInput(): void {
    document.getElementById("code")!.classList.add("hidden");
    document.getElementById("input")!.classList.remove("hidden");
    input.focus();
}