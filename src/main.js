/*jslint browser: true */
/*global require */

var $ = require('./lib/jquery-2.1.3');

var Editor = require('./app/editor');
var Parser = require('./app/parser');
var Terminal = require('./app/terminal');
var AudioSystem = require('./app/audiosystem');
var Core = require('./app/core');

$(function () {

    var audioContext = AudioSystem.createContext(window);
    var audio = AudioSystem.createSystem(audioContext);
    var parser = Parser.create();

    var terminal = Terminal.create($("#terminal-body"));
    terminal.displayHeader();

    var core = Core.create(parser, terminal, audio);

    var editor = Editor.create($('#program'), core.handleCode);

});

