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

export { EventListener };

abstract class EventListener {

    private readonly listeners: Map<string,{ (...argv: any[]): void }[]> = new Map();

    public on(event: string, listener: (...argv: any[]) => void): EventListener {
        if(!this.listeners.has(event))
            this.listeners.set(event, []);
        this.listeners.get(event)!.push(listener);
        return this;
    }

    protected handle(event: string, ...argv: any[]): void {
        for(let [k, v] of this.listeners){
            if(k == event){
                for(let h of v)
                    h(argv);
                return;
            }
        }
    }

}