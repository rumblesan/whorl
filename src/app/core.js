/*global require */

var createCore = function (parser, interpreter) {

    var Core = {};

    Core.handleCode = function (code) {
        try {
            var ast = parser.parse(code);
            interpreter.interpret(ast);
        } catch (err) {
            console.log(err);
        }
    };

    return Core;
};

module.exports = {
    create: createCore
};

