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
const input: HTMLInputElement = document.getElementById("text-input") as HTMLInputElement;

// lock input
input.onblur = () => input.focus();
input.focus();

// display input
input.oninput = () => { pushInput(); }

// push input
input.onkeydown = (e:KeyboardEvent) => {
    if(e.key == "Enter"){
        pushInput();
        input.value = "";
    }
}

function pushInput(): void {
    const value = input.value || "";
}

// event stream
const stream = new EventSource("event");
stream.onmessage = function(event: MessageEvent){
    const data: string = event.data;
    if(data === "true")
        showInput();
}

function showInput(): void{
    stream.close();
    document.getElementById("code")?.classList.add("hidden");
    document.getElementById("input")?.classList.remove("hidden");
    input.focus();
}