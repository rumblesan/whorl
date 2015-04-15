/*global require */

var CodeMirror = require('../codemirror/lib/codemirror');
require('../codemirror/keymap/vim');

var createEditor = function (editorEl, parser) {

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

    CodeMirror.Vim.map(',', 'va(');

    var editor = CodeMirror(editorEl, {
        keyMap: 'vim'
    });

    return editor;
};

module.exports = {
    create: createEditor
};

