/* @flow */

var StdLib = require('./stdlib');
var ScopeHandler = require('./scopeHandler').create();
var Interpreter = require('./interpreter').create(ScopeHandler);
var Error = require('./error');

var Parser = require('./parser').create();

var createCore = function (audio: WebAudioContext, dispatcher: Dispatcher): any {

    var Core = {};

    var globalScope = ScopeHandler.createScope();
    StdLib.addFunctions(audio, dispatcher, ScopeHandler, globalScope);

    Core.handleCode = function (code) {
        var ast;
        try {
            ast = Parser.parse(code);
            Interpreter.evaluate(globalScope, ast);
        } catch (err) {
            if (err.internal === true) {
                Core.displayError(err);
            } else {
                throw err;
            }
        }
    };

    Core.scheduleCallback = function (time, closure) {
        setTimeout(function () {
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
    };

    Core.displayError = function (err) {
        console.log(err);
        var errLines;
        if (typeof err.message === 'string') {
            errLines = [err.message];
        } else {
            errLines = err.message;
        }
        dispatcher.dispatch('term-error', errLines.join("\n"));
    };

    dispatcher.register('execute-code', function (code) {
        Core.handleCode(code);
    });

    dispatcher.register('schedule-callback', function (time, closure) {
        Core.scheduleCallback(time, closure);
    });

    return Core;
};

module.exports = {
    create: createCore
};

