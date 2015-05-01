/* @flow */

var $ = require('../lib/jquery-2.1.3');

var Dispatch = require('./util/dispatcher');

var NavBar = require('./navbar');
var Editor = require('./editor');
var Terminal = require('./terminal');
var Core = require('./core');
var AudioSystem = require('./audiosystem');

var Whorl = {};

Whorl.create = function () {

    var dispatcher: Dispatcher = Dispatch.create();

    var navbar = NavBar.create(dispatcher);

    var terminal = Terminal.create($("#terminal-body"), dispatcher);

    var editor = Editor.create($('#program'), dispatcher);

    try {
        var audioContext = AudioSystem.createContext(window);

        var core = Core.create(audioContext, dispatcher);

        terminal.displayHeader();
    } catch (e) {
        console.log(e);
        terminal.error(e);
    }

};

module.exports = Whorl;

