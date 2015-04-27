/*jslint browser: true */
/*global require */

var $ = require('../lib/jquery-2.1.3');

var Dispatcher = require('./util/dispatcher');

var NavBar = require('./navbar');
var Editor = require('./editor');
var Parser = require('./parser');
var Terminal = require('./terminal');
var AudioSystem = require('./audiosystem');
var Core = require('./core');

var Whorl = {};

Whorl.create = function () {

    var dispatcher = Dispatcher.create();

    var navbar = NavBar.create(dispatcher);

    var audioContext = AudioSystem.createContext(window);
    var audio = AudioSystem.createSystem(audioContext);

    var parser = Parser.create();

    var terminal = Terminal.create($("#terminal-body"), dispatcher);

    var core = Core.create(parser, audio, dispatcher);

    var editor = Editor.create($('#program'), dispatcher);

    terminal.displayHeader();
};

module.exports = Whorl;

