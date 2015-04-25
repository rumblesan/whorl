/*jslint browser: true */
/*global require */

var $ = require('../lib/jquery-2.1.3');

var Editor = require('./editor');
var Parser = require('./parser');
var Terminal = require('./terminal');
var AudioSystem = require('./audiosystem');
var Core = require('./core');

var Whorl = {};

Whorl.create = function () {

    var audioContext = AudioSystem.createContext(window);
    var audio = AudioSystem.createSystem(audioContext);
    var parser = Parser.create();

    var terminal = Terminal.create($("#terminal-body"));
    terminal.displayHeader();

    var core = Core.create(parser, terminal, audio);

    var editor = Editor.create($('#program'), core.handleCode);

};

module.exports = Whorl;

