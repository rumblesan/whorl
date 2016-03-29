/*jslint browser: true */

import * as Editor      from './ui/editor';
import * as Terminal    from './ui/terminal';

import * as Core        from './core';
import * as AudioSystem from './audio';

export const create = (dispatcher) => {

    const terminal = Terminal.create(document.getElementById('terminal-body'), dispatcher);

    Editor.create(document.getElementById('program'), dispatcher);

    try {
        const audioContext = AudioSystem.createContext(window);

        Core.create(audioContext, dispatcher);

        terminal.displayHeader();
    } catch (e) {
        console.log(e);
        //terminal.error(e);
    }

};

