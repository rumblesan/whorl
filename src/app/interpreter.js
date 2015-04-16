/*global require */

var createInterpreter = function () {

    var Interpreter = {};

    Interpreter.interpret = function (ast) {
        console.log('ast', ast);
    };

    return Interpreter;
};

module.exports = {
    create: createInterpreter
};

