/*jslint browser: true */
/*global require */

var domready = require('./lib/ready');
var App = require('./app/app');

var Editor = require('./app/editor');
var Parser = require('./parser').parser;

domready(function () {

    Parser.yy.parseError = function (message, details) {
        throw [message, details];
    };

    var editorEl = document.getElementById('program');
    var editor = Editor.create(editorEl, Parser);

    var app = App.create();

    app.run();

});

