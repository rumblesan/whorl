/*global require */

var StdLib = require('./stdLib');
var ScopeHandler = require('./scopeHandler').create();
var Interpreter = require('./interpreter').create(ScopeHandler);
var Error = require('./error');

var createCore = function (parser, audio, dispatcher) {

    var Core = {};

    Core.Audio = audio;

    var globalScope = ScopeHandler.createScope();
    StdLib.addFunctions(Core, ScopeHandler, globalScope);

    Core.handleCode = function (code) {
        var ast;
        try {
            ast = parser.parse(code);
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

    Core.display = function (data) {
        console.log(data);
        dispatcher.dispatch('term-message', data);
    };

    dispatcher.register('execute-code', function (code) {
        Core.handleCode(code);
    });

    return Core;
};

module.exports = {
    create: createCore
};

