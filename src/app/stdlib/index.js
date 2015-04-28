/* @flow */

var Math = require('./math');
var Comparison = require('./comparison');
var Logic = require('./logic');
var Timing = require('./timing');
var Audio = require('./audio');

var addFunctions = function (Core, ScopeHandler, scope) {

    Math.addFunctions(Core, ScopeHandler, scope);
    Comparison.addFunctions(Core, ScopeHandler, scope);
    Logic.addFunctions(Core, ScopeHandler, scope);
    Timing.addFunctions(Core, ScopeHandler, scope);
    Audio.addFunctions(Core, ScopeHandler, scope);

    var display = function (v) {
        Core.display(v);
    };
    ScopeHandler.addFF(scope, 'display', display);
};

module.exports = {
    addFunctions: addFunctions
};

