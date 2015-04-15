/*global require */

var CodeMirror = require('../codemirror/lib/codemirror');
require('../codemirror/keymap/vim');

var createEditor = function (editorEl, codeHandlerFunc) {

    CodeMirror.Vim.defineAction('execute', function (cm, args, vim) {
        var code = cm.doc.getSelection();
        codeHandlerFunc(code);
    });
    CodeMirror.Vim.mapCommand('<C-g>', 'action', 'keyexecute', null, {
        action: 'execute'
    });

    CodeMirror.Vim.map(',', 'va(');

    var editor = CodeMirror(editorEl, {
        keyMap: 'vim'
    });

    return editor;
};

module.exports = {
    create: createEditor
};

