import { EventEmitter } from 'events';

const CHANGE_EVENT = 'change';

export const create = (dispatcher) => {
    const state = {
        lines: []
    };
    const TerminalText = Object.assign({}, EventEmitter.prototype, {

        emitChange: function(payload) {
            this.emit(CHANGE_EVENT, payload);
        },

        addChangeListener: function(callback) {
            this.on(CHANGE_EVENT, callback);
        },

        removeChangeListener: function(callback) {
            this.removeListener(CHANGE_EVENT, callback);
        },

        getState() {
            return state;
        },

        addInfo(text) {
            state.lines.push({
                type: 'info',
                text: text
            });
            console.log(`Info: ${text}`);
            this.emitChange(state);
        },

        addError(text) {
            state.lines.push({
                type: 'error',
                text: text
            });
            console.log(`Error: ${text}`);
            this.emitChange(state);
        }

    });

    dispatcher.register((action) => {
        switch (action.type) {
        case 'LOAD-DEMO':
            TerminalText.addInfo(`Loading Demo: ${action.demoName}`);
            break;
        case 'LOAD-TUTORIAL':
            TerminalText.addInfo(`Loading Tutorial: ${action.tutorialName}`);
            break;
        case 'SET-KEY-BINDINGS':
            TerminalText.addInfo(`Setting key bindings: ${action.keyBindingName}`);
            break;
        default:
            // do nothing
        }
    });

    return TerminalText;
}
