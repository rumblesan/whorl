/*jslint browser: true */
/*global require */

var $ = require('./lib/jquery-2.1.3');

var App = require('./app/app');
var Editor = require('./app/editor');
var Parser = require('./app/parser');
var Terminal = require('./app/terminal');
var Core = require('./app/core');

$(function () {

    var parser = Parser.create();

    var terminal = Terminal.create($("#terminal-body"));
    terminal.displayHeader();

    var core = Core.create(parser, terminal);

    var editor = Editor.create($('#program'), core.handleCode);

    var app = App.create();

    app.run();

});

