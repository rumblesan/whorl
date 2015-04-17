/*global require */

var createTerminal = function (terminalBodyEl) {

    var Terminal = {};

    var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        ' ': '&nbsp;'
    };
    var replaceTag = function (tag) {
        return tagsToReplace[tag] || tag;
    };
    var symbolReplace = function(str) {
        return str.replace(/[&<> ]/g, replaceTag);
    };

    var safeToString = function (x) {
        switch (typeof x) {
            case 'object':
                return 'object';
            case 'function':
                return 'function';
            default:
                return x + '';
        }
    }

    var msgPrompt = "<msg>" + symbolReplace(">> ") + "</msg>";
    var errPrompt = "<err>" + symbolReplace(">> ") + "</err>";

    var header = [
        "#####################",
        "#                   #",
        "#     WEB SOUND     #",
        "#                   #",
        "#####################"
    ]
    Terminal.displayHeader = function () {
        var el = terminalBodyEl.children("p:first");
        var i;
        for (i = 0; i < header.length; i += 1) {
            el.append(
                "<heading>" + symbolReplace(header[i]) + "</heading><br>\n"
            );
        }
    };

    Terminal.message = function (msg) {
        terminalBodyEl.children("p:first").append(
            msgPrompt + symbolReplace(safeToString(msg)) + "<br>\n"
        );
        Terminal.scrollToBottom();
    };

    Terminal.error = function (err) {
        terminalBodyEl.children("p:first").append(
            errPrompt + symbolReplace(safeToString(err)) + "<br>\n"
        );
        Terminal.scrollToBottom();
    };

    Terminal.scrollToBottom = function () {
        terminalBodyEl.scrollTop(terminalBodyEl.prop('scrollHeight'));
    };

    return Terminal;
};

module.exports = {
    create: createTerminal
};

