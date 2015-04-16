/* global require */

var Audio = require('./audio');
var Timing = require('./timing');

var addFunctions = function (Core, ScopeHandler, scope) {

    var plus = function (a, b) {
        return a + b;
    };
    ScopeHandler.addFF(scope, '+', plus);

    var minus = function (a, b) {
        return a - b;
    };
    ScopeHandler.addFF(scope, '-', minus);

    var multiply = function (a, b) {
        return a * b;
    };
    ScopeHandler.addFF(scope, '*', multiply);

    var divide = function (a, b) {
        return a / b;
    };
    ScopeHandler.addFF(scope, '/', divide);

    var display = function (v) {
        console.log(v);
    };
    ScopeHandler.addFF(scope, 'display', display);

    Audio.addFunctions(Core, ScopeHandler, scope);
    Timing.addFunctions(Core, ScopeHandler, scope);
};

module.exports = {
    addFunctions: addFunctions
};

