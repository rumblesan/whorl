/*global require */

var CodeMirror = require('../codemirror/lib/codemirror');
require('../codemirror/keymap/vim');
require('../codemirror/mode/scheme/scheme');

var createEditor = function (editorEl, dispatcher) {

    CodeMirror.Vim.defineAction('execute', function (cm, args, vim) {
        var code = cm.doc.getSelection();
        dispatcher.dispatch('execute-code', code);
    });
    CodeMirror.Vim.mapCommand('<C-g>', 'action', 'keyexecute', null, {
        action: 'execute'
    });

    CodeMirror.Vim.map(',', 'va(');

    // unwrap from jquery
    var editor = CodeMirror(editorEl[0], {
        keyMap: 'vim',
        mode: 'scheme'
    });

    dispatcher.register('load-program', function (programName, programData) {
        editor.doc.setValue(programData);
    })

    return editor;
};

module.exports = {
    create: createEditor
};

