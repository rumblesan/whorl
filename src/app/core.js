/*global require */

var StdLib = require('./stdLib');
var ScopeHandler = require('./scopeHandler').create();
var Interpreter = require('./interpreter').create(ScopeHandler);
var Error = require('./error');

var createCore = function (parser, terminal, audio) {

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
        var i;
        for (i = 0; i < errLines.length; i += 1) {
            terminal.error(errLines[i]);
        }
    };

    Core.display = function (data) {
        console.log(data);
        terminal.message(data);
    };

    return Core;
};

module.exports = {
    create: createCore
};

