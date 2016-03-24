/*jslint browser: true */

const $ = require('../lib/jquery-2.1.3');

import {Dispatcher} from 'flux';

import * as NavBar      from './ui/navbar';
import * as Editor      from './ui/editor';
import * as Terminal    from './ui/terminal';

import * as Core        from './core';
import * as AudioSystem from './audio';

export const create = () => {

    const dispatcher = new Dispatcher();

    NavBar.create(dispatcher);

    const terminal = Terminal.create($('#terminal-body'), dispatcher);

    Editor.create($('#program'), dispatcher);

    try {
        const audioContext = AudioSystem.createContext(window);

        Core.create(audioContext, dispatcher);

        terminal.displayHeader();
    } catch (e) {
        console.log(e);
        terminal.error(e);
    }

};

