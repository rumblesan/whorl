/*global require */

var StdLib = require('./stdLib');
var ScopeHandler = require('./scopeHandler').create();
var Interpreter = require('./interpreter').create(ScopeHandler);

var createCore = function (parser) {

    var Core = {};

    var globalScope = ScopeHandler.createScope();
    StdLib.addFunctions(Core, ScopeHandler, globalScope);

    Core.handleCode = function (code) {
        var ast;
        try {
            ast = parser.parse(code);
            Interpreter.evaluate(globalScope, ast);
        } catch (err) {
            console.log(err);
            if (ast) {
                console.log(ast);
            }
        }
    };

    Core.scheduleCallback = function (time, closure) {
        setTimeout(function () {
            try {
                Interpreter.apply(globalScope, closure, []);
            } catch (err) {
                console.log(err);
            }
        }, time);
    };

    return Core;
};

module.exports = {
    create: createCore
};

