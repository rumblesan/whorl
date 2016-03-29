import { EventEmitter } from 'events';
import _ from 'underscore';

const CHANGE_EVENT = 'change';

export const create = (dispatcher) => {
    const state = {
        lines: []
    };
    const AppState = Object.assign({}, EventEmitter.prototype, {

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
            this.state.lines.push({
                type: 'info',
                text: text
            });
            console.log(`Info: ${text}`);
            this.emitChange(state);
        },

        addError(text) {
            this.state.lines.push({
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
            AppState.addInfo(`Loading Demo: ${action.demoName}`);
            break;
        case 'LOAD-TUTORIAL':
            AppState.addInfo(`Loading Tutorial: ${action.tutorialName}`);
            break;
        case 'SET-KEY-BINDINGS':
            AppState.addInfo(`Setting key bindings: ${action.keyBindingName}`);
            break;
        default:
            // do nothing
        }
    });

    return AppState;
}
