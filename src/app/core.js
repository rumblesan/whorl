
var StdLib = require('./stdlib');
var ScopeHandler = require('./scopeHandler');
var Interpreter = require('./interpreter');
var Error = require('./error');

var AudioSystem = require('./audio');

var Parser = require('./parser').create();

var createCore = function (audioContext, dispatcher) {

    var Core = {};

    var audio = AudioSystem.createSystem(audioContext);
    var scopeHandler = ScopeHandler.create();
    var interpreter = Interpreter.create(scopeHandler);
    var globalScope = scopeHandler.createScope();

    StdLib.add(audio, dispatcher, scopeHandler, globalScope);

    Core.handleCode = function (code) {
        var ast;
        try {
            ast = Parser.parse(code);
            interpreter.evaluate(globalScope, ast);
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
                interpreter.apply(globalScope, closure, []);
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

