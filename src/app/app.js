/*jslint browser: true */
/*global require */

'use strict';

var CodeMirror = require('../codemirror/lib/codemirror');
require('../codemirror/keymap/vim');

var createApp = function (textarea) {

    var App = {};

    App.codemirror = CodeMirror.fromTextArea(textarea, {
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

