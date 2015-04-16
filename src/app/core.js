/*global require */

var StdLib = require('./stdLib');
var ScopeHandler = require('./scopeHandler').create();
var Interpreter = require('./interpreter').create(ScopeHandler);

var createCore = function (parser) {

    var Core = {};

    var globalScope = ScopeHandler.createScope();
    StdLib.addFunctions(ScopeHandler, globalScope);
    console.log(globalScope);

    Core.handleCode = function (code) {
        try {
            var ast = parser.parse(code);
            Interpreter.interpret(globalScope, ast);
        } catch (err) {
            console.log(err);
        }
    };

    return Core;
};

module.exports = {
    create: createCore
};

