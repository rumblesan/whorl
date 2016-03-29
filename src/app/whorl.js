/*jslint browser: true */

import * as Editor      from './ui/editor';

import * as Core        from './core';
import * as AudioSystem from './audio';

export const create = (dispatcher) => {

    Editor.create(document.getElementById('program'), dispatcher);

    try {
        const audioContext = AudioSystem.createContext(window);

        Core.create(audioContext, dispatcher);

    } catch (e) {
        console.log(e);
    }

};

