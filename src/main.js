/*jslint browser: true */
/*global require */

var domready = require('./lib/ready');
var App = require('./app/app');

var Editor = require('./app/editor');

var Parser = require('./app/parser');
var Interpreter = require('./app/interpreter');

var Core = require('./app/core');

domready(function () {

    var parser = Parser.create();
    var interpreter = Interpreter.create();

    var core = Core.create(parser, interpreter);

    var editorEl = document.getElementById('program');
    var editor = Editor.create(editorEl, core.handleCode);

    var app = App.create();

    app.run();

});

