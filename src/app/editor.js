/* @flow */

var CodeMirror = require('../codemirror/lib/codemirror');
require('../codemirror/keymap/vim');
require('../codemirror/mode/scheme/scheme');

var createEditor = function (editorEl, dispatcher: Dispatcher) {

    CodeMirror.Vim.defineAction('execute', function (cm, args, vim) {
        var code = cm.doc.getSelection();
        dispatcher.dispatch('execute-code', code);
    });

    // unwrap from jquery
    var editor = CodeMirror(editorEl[0], {
        mode: 'scheme'
    });

    editor.setOption("extraKeys", {
      "Ctrl-G": function(cm) {
        var code = cm.doc.getSelection();
        dispatcher.dispatch('execute-code', code);
      }
    });

    dispatcher.register('load-program', function (programName, programData) {
        editor.doc.setValue(programData);
    })

    dispatcher.register('set-key-binding', function (bindingName) {
        editor.setOption('keymap', bindingName);
        if (bindingName === 'vim') {
            editor.setOption('vimMode', true);
        } else {
            editor.setOption('vimMode', false);
        }
    })

    console.log(editor);

    return editor;
};

module.exports = {
    create: createEditor
};

