
// Use require so that plugins load correctly
var CodeMirror = require('../../codemirror/lib/codemirror');
import '../../codemirror/keymap/vim';
import '../../codemirror/mode/scheme/scheme';

export const create = (editorEl, dispatcher) => {

    CodeMirror.Vim.defineAction('execute', (cm, args, vim) => {
        const code = cm.doc.getSelection();
        dispatcher.dispatch({
            type: 'execute-code',
            code: code
        });
    });

    const editor = CodeMirror(editorEl, {
        mode: 'scheme'
    });

    editor.setOption('extraKeys', {
        'Ctrl-G': function (cm) {
            const code = cm.doc.getSelection();
            dispatcher.dispatch({
                type: 'execute-code',
                code: code
            });
        }
    });

    dispatcher.register((action) => {
        switch (action.type) {
        case 'load-program':
            editor.doc.setValue(action.programData);
            break;
        case 'set-key-binding':
            editor.setOption('keymap', action.bindingName);
            if (action.bindingName === 'vim') {
                editor.setOption('vimMode', true);
            } else {
                editor.setOption('vimMode', false);
            }
            break;
        default:
            // do nothing
        }
    });

    return editor;
};

