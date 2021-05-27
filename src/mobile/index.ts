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

// handle IME events
let before: string = ""; // content before IME (used for stiching)
let isTypingIME: boolean = false;
input.addEventListener("compositionstart", () => {
    isTypingIME = true;
    before = input.value || "";
});
input.addEventListener("compositionend", () => {
    isTypingIME = false;
    handleInput(); // fix mobile devices not updating input
});

// handle visual input
const handleInput = (value?: string) => {
    const request: XMLHttpRequest = new XMLHttpRequest();

    request.open("GET", "input?q=" + encodeURIComponent(value ? value : input.value || ""), true);
    request.send(null);
}

input.oninput = () => {
    if(!isTypingIME)
        handleInput();
};
input.addEventListener("compositionupdate", (event: CompositionEvent) => handleInput(before + event.data));

// push input
input.onkeydown = (e:KeyboardEvent) => {
    if(!isTypingIME && e.key == "Enter"){
        const request: XMLHttpRequest = new XMLHttpRequest();
        request.open("GET", "submit", true);
        request.send(null);
        input.value = "";
    }
}

// handle code
const stream: EventSource = new EventSource("event");
stream.onmessage = function(event: MessageEvent): void {
    if(event.data == "true"){
        showInput();
        stream.close();
    }
}

function showInput(): void {
    document.getElementById("code")!.classList.add("hidden");
    document.getElementById("input")!.classList.remove("hidden");
    input.focus();
}

// lock input
input.onblur = () => input.focus();
input.focus();