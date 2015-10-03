/*jslint browser: true */

const $ = require('../lib/jquery-2.1.3');

const Dispatch = require('./util/dispatcher');

import * as NavBar   from './ui/navbar';
import * as Editor   from './ui/editor';
import * as Terminal from './ui/terminal';

const Core = require('./core');
const AudioSystem = require('./audio');

const Whorl = {};

Whorl.create = function () {

    const dispatcher = Dispatch.create();

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

module.exports = Whorl;

