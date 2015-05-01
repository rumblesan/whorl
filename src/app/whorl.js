/* @flow */

var $ = require('../lib/jquery-2.1.3');

var Dispatch = require('./util/dispatcher');

var NavBar = require('./navbar');
var Editor = require('./editor');
var Terminal = require('./terminal');
var AudioSystem = require('./audiosystem');
var Core = require('./core');

var Whorl = {};

Whorl.create = function () {

    var dispatcher: Dispatcher = Dispatch.create();

    var navbar = NavBar.create(dispatcher);

    var audioContext = AudioSystem.createContext(window);
    var audio = AudioSystem.createSystem(audioContext);

    var terminal = Terminal.create($("#terminal-body"), dispatcher);

    var core = Core.create(audio, dispatcher);

    var editor = Editor.create($('#program'), dispatcher);

    terminal.displayHeader();
};

module.exports = Whorl;

