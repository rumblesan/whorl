/*jslint browser: true */
/*global require */

var domready = require('./lib/ready');
var App = require('./app/app');

var Editor = require('./app/editor');

var Parser = require('./app/parser');

var Core = require('./app/core');

domready(function () {

    var parser = Parser.create();

    var core = Core.create(parser);

    var editorEl = document.getElementById('program');
    var editor = Editor.create(editorEl, core.handleCode);

    var app = App.create();

    app.run();

});

