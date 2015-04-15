/*global require */

var createCore = function (Interpreter) {

    var Core = {};

    Core.handleCode = function (code) {
        try {
            var ast = Interpreter.parse(code);
            Interpreter.interpret(ast);
        } catch (err) {
            console.log(err);
        }
    };

    return Core;
};

module.exports = {
    create: createCore
};

