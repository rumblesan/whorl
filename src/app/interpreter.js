/*global require */

var Parser = require('../parser').parser;

var createInterpreter = function () {

    var Interpreter = {};

    Parser.yy.parseError = function (message, details) {
        throw [message, details];
    };

    // Can raise an exception
    Interpreter.parse = function (code) {
        return Parser.parse(code);
    };

    Interpreter.interpret = function (ast) {
        console.log('ast', ast);
    };

    return Interpreter;
};

module.exports = {
    create: createInterpreter
};

