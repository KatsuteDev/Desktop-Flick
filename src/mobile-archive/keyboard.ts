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
const kbd_num: HTMLElement = document.getElementById("kbd-numbers")!;
const kbd_ltn: HTMLElement = document.getElementById("kbd-latin")!;
const kbd_jpn: HTMLElement = document.getElementById("kbd-japanese")!;

const cat_num: HTMLElement = document.getElementById("cat-numbers")!;
const cat_ltn: HTMLElement = document.getElementById("cat-latin")!;
const cat_jpn: HTMLElement = document.getElementById("cat-japanese")!;

cat_num.onclick = (e:Event) => hideAllExcept(kbd_num);
cat_ltn.onclick = (e:Event) => hideAllExcept(kbd_ltn);
cat_jpn.onclick = (e:Event) => hideAllExcept(kbd_jpn);

hideAllExcept(kbd_jpn);

function hideAllExcept(e: HTMLElement): void {
    if(e != kbd_num)
        kbd_num.classList.add("hidden")
    else
        kbd_num.classList.remove("hidden")
    if(e != kbd_ltn)
        kbd_ltn.classList.add("hidden")
    else
        kbd_ltn.classList.remove("hidden")
    if(e != kbd_jpn)
        kbd_jpn.classList.add("hidden")
    else
        kbd_jpn.classList.remove("hidden")
}


function getPosition(x: number, y: number, width: number, height: number): number {
    const absx = Math.abs(x);
    const absy = Math.abs(y);
    if(absx <= width / 2 && absy <= height / 2)
        return 0;
    else if(x < 0 && absy < absx)
        return 1;
    else if(x >= 0 && absy < absx)
        return 3;
    else if(y < 0 && absx <= absy)
        return 2;
    else if(y >= 0 && absx < absy)
        return 4;
    return 0;
}

for(const e of document.getElementsByTagName("flick-button")){
    console.log(e);
}