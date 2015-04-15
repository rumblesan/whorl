/*jslint browser: true */
/*global require */

var domready = require('./lib/ready');
var App = require('./app/app');

var Editor = require('./app/editor');

var Interpreter = require('./app/interpreter');

var Core = require('./app/core');

domready(function () {

    var interpreter = Interpreter.create();

    var core = Core.create(interpreter);

    var editorEl = document.getElementById('program');
    var editor = Editor.create(editorEl, core.handleCode);

    var app = App.create();

    app.run();

});

