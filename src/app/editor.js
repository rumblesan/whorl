
// Use require so that plugins load correctly
var CodeMirror = require('../codemirror/lib/codemirror');
import '../codemirror/keymap/vim';
import '../codemirror/mode/scheme/scheme';

export const create = function (editorEl, dispatcher) {

    CodeMirror.Vim.defineAction('execute', (cm, args, vim) => {
        const code = cm.doc.getSelection();
        dispatcher.dispatch('execute-code', code);
    });

    // unwrap from jquery
    const editor = CodeMirror(editorEl[0], {
        mode: 'scheme'
    });

    editor.setOption('extraKeys', {
        'Ctrl-G': function(cm) {
            const code = cm.doc.getSelection();
            dispatcher.dispatch('execute-code', code);
        }
    });

    dispatcher.register('load-program', (programName, programData) => {
        editor.doc.setValue(programData);
    });

    dispatcher.register('set-key-binding', (bindingName) => {
        editor.setOption('keymap', bindingName);
        if (bindingName === 'vim') {
            editor.setOption('vimMode', true);
        } else {
            editor.setOption('vimMode', false);
        }
    });

    return editor;
};

