/*jslint browser: true */
/*global require */

var $ = require('./lib/jquery-2.1.3');

var App = require('./app/app');
var Editor = require('./app/editor');
var Parser = require('./app/parser');

var Core = require('./app/core');

$(function () {

    var parser = Parser.create();

    var core = Core.create(parser);

    var editorEl = document.getElementById('program');
    var editor = Editor.create(editorEl, core.handleCode);

    var app = App.create();

    app.run();

});

