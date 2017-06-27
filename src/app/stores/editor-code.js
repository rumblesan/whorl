import { EventEmitter } from 'events';

const CHANGE_EVENT = 'change';

export const create = (dispatcher, demos, tutorials) => {
    const state = {
        code: '(print "Welcome to Whorl!")'
    };
    const EditorCode = Object.assign({}, EventEmitter.prototype, {

        emitChange: function(payload) {
            this.emit(CHANGE_EVENT, payload);
        },

        addChangeListener: function(callback) {
            this.on(CHANGE_EVENT, callback);
        },

        removeChangeListener: function(callback) {
            this.removeListener(CHANGE_EVENT, callback);
        },
        getCode() {
            return state.code;
        },
        loadTutorial(name) {
            if (tutorial[name]) {
                state.code = tutorial[name]
                this.emitChange(state);
            } else {
                dispatcher.dispatch({
                    type: 'ERROR',
                    text: `Could not find tutorial ${name}`
                });
            }
        },
        loadDemo(name) {
            if (demos[name]) {
                state.code = demos[name]
                this.emitChange(state);
            } else {
                dispatcher.dispatch({
                    type: 'ERROR',
                    text: `Could not find demo ${name}`
                });
            }
        }

    });

    dispatcher.register((action) => {
        switch (action.type) {
        case 'LOAD-DEMO':
            EditorCode.loadDemo(action.demoName);
            break;
        case 'LOAD-TUTORIAL':
            EditorCode.loadTutorial(action.tutorialName);
            break;
        default:
            // do nothing
        }
    });

    return EditorCode;
}
