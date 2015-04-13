/*jslint browser: true */
/*global require */

'use strict';

var CodeMirror = require('../codemirror/lib/codemirror');
require('../codemirror/keymap/vim');

var parser = require('../parser').parser;


var createApp = function (programarea) {

    var App = {};

    parser.yy.parseError = function (message, details) {
        throw [message, details];
    };

    var testcode = '(define bba "sdf")';

    var out = [];
    try {
        out = parser.parse(testcode);
    } catch(err) {
        console.log(err[0], err[1]);
    }

    console.log(out, 'done');


    App.codemirror = CodeMirror(programarea, {
        value: '(hello world)',
        keyMap: 'vim'
    });

    App.run = function () {

        console.log('asdf');

    };

    return App;
}

module.exports = {
    create: createApp
};

