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

    var header = [
        "#####################",
        "#                   #",
        "#     WEB SOUND     #",
        "#                   #",
        "#####################"
    ]
    Terminal.displayHeader = function () {
        var el = terminalBodyEl.children("p:first");
        var str;
        var i;
        for (i = 0; i < header.length; i += 1) {
            str = symbolReplace(header[i]);
            el.append(str + "<br>\n");
        }
    };

    Terminal.addLine = function (string) {
        terminalBodyEl.children("p:first").append(symbolReplace(string) + "<br>\n");
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

