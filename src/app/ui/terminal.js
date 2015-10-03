

export const create = (terminalBodyEl, dispatcher) => {

    const tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        ' ': '&nbsp;'
    };
    const replaceTag = (tag) => {
        return tagsToReplace[tag] || tag;
    };
    const symbolReplace = (str) => {
        return str.replace(/[&<> ]/g, replaceTag);
    };

    const safeToString = (x) => {
        switch (typeof x) {
        case 'object':
            return 'object';
        case 'function':
            return 'function';
        default:
            return String(x);
        }
    };

    const msgPrompt = `<msg>${symbolReplace('>> ')}</msg>`;
    const errPrompt = `<err>${symbolReplace('>> ')}</err>`;

    const header = [
        '#####################',
        '#                   #',
        '#     WEB SOUND     #',
        '#                   #',
        '#####################'
    ];

    const Terminal = {

        displayHeader: function () {
            const el = terminalBodyEl.children('p:first');
            let i;
            for (i = 0; i < header.length; i += 1) {
                el.append(
                    `<heading>${symbolReplace(header[i])}</heading><br>\n`
                );
            }
        },

        message: function (msg) {
            terminalBodyEl.children('p:first').append(
                `${msgPrompt}${symbolReplace(safeToString(msg))}<br>\n`
            );
            Terminal.scrollToBottom();
        },

        error: function (err) {
            terminalBodyEl.children('p:first').append(
                `${errPrompt}${symbolReplace(safeToString(err))}<br>\n`
            );
            Terminal.scrollToBottom();
        },

        scrollToBottom: function () {
            terminalBodyEl.scrollTop(terminalBodyEl.prop('scrollHeight'));
        }

    };

    dispatcher.register('term-message', (message) => {
        Terminal.message(message);
    });

    dispatcher.register('term-error', (error) => {
        Terminal.error(error);
    });

    return Terminal;
};

