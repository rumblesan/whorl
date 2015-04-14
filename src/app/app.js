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

    App.codemirror = CodeMirror(programarea, {
        keyMap: 'vim'
    });

    CodeMirror.Vim.defineAction('execute', function (cm, args, vim) {
        var code = cm.doc.getSelection();
        try {
            var ast = parser.parse(code);
            console.log(ast);
        } catch (err) {
            console.log(err[0], err[1]);
        }
    });
    CodeMirror.Vim.mapCommand('<C-g>', 'action', 'keyexecute', null, {
        action: 'execute'
    });

    App.run = function () {


    };

    return App;
}

module.exports = {
    create: createApp
};

