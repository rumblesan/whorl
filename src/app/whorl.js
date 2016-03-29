/*jslint browser: true */

import * as Core        from './core';
import * as AudioSystem from './audio';

export const create = (dispatcher) => {

    try {
        const audioContext = AudioSystem.createContext(window);

        Core.create(audioContext, dispatcher);

    } catch (e) {
        console.log(e);
    }

};

