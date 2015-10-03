
import * as StdLib       from './stdlib';
import * as ScopeHandler from './language/scopeHandler';
import * as Interpreter  from './language/interpreter';

import * as AudioSystem  from './audio';

import * as Parser       from './language/parser';

export const create = (audioContext, dispatcher) => {

    const audio        = AudioSystem.createSystem(audioContext);
    const interpreter  = Interpreter.create(ScopeHandler);
    const globalScope  = ScopeHandler.createScope();

    StdLib.add(audio, dispatcher, ScopeHandler, globalScope);

    const Core = {

        handleCode: function (code) {
            try {
                let ast = Parser.parse(code);
                interpreter.evaluate(globalScope, ast);
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
                    interpreter.apply(globalScope, closure, []);
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
            dispatcher.dispatch('term-error', errLines.join('\n'));
        }
    };

    dispatcher.register('execute-code', (code) => {
        Core.handleCode(code);
    });

    dispatcher.register('schedule-callback', (time, closure) => {
        Core.scheduleCallback(time, closure);
    });

    return Core;
};

