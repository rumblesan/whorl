
import * as StdLib       from './stdlib';
import * as ScopeHandler from './language/scopeHandler';
import * as Interpreter  from './language/interpreter';

import * as AudioSystem  from './audio';

import * as Parser       from './language/parser';

export const create = (audioContext, dispatcher) => {

    const audio        = AudioSystem.createSystem(audioContext);
    const globalScope  = ScopeHandler.createScope();

    StdLib.add(audio, dispatcher, globalScope);

    const Core = {

        handleCode: function (code) {
            try {
                let ast = Parser.parse(code);
                Interpreter.evaluate(globalScope, ast);
            } catch (err) {
                if (err.internal === true) {
                    Core.displayError(err);
                } else {
                    throw err;
                }
            }
        },

        scheduleCallback: function (time, closure) {
            setTimeout(() => {
                try {
                    Interpreter.apply(globalScope, closure, []);
                } catch (err) {
                    if (err.internal === true) {
                        Core.displayError(err);
                    } else {
                        throw err;
                    }
                }
            }, time);
        },

        displayError: function (err) {
            let errLines;
            if (typeof err.message === 'string') {
                errLines = [err.message];
            } else {
                errLines = err.message;
            }
            dispatcher.dispatch({
                type: 'term-error',
                text: errLines.join('\n')
            });
        }
    };

    dispatcher.register((action) => {
        switch (action.type) {
        case 'execute-code':
            Core.handleCode(action.code);
            break;
        case 'schedule-callback':
            Core.scheduleCallback(action.time, action.closure);
            break;
        default:
            // do nothing
        }
    });

    return Core;
};

