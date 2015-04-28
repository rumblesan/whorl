/* @flow */

var Math = require('./math');
var Comparison = require('./comparison');
var Logic = require('./logic');
var Timing = require('./timing');
var Audio = require('./audio');

var addFunctions = function (audio, dispatcher, ScopeHandler, scope) {

    Math.addFunctions(audio, dispatcher, ScopeHandler, scope);
    Comparison.addFunctions(audio, dispatcher, ScopeHandler, scope);
    Logic.addFunctions(audio, dispatcher, ScopeHandler, scope);
    Timing.addFunctions(audio, dispatcher, ScopeHandler, scope);
    Audio.addFunctions(audio, dispatcher, ScopeHandler, scope);

    ScopeHandler.addFF(scope, 'display', function (data) {
        dispatcher.dispatch('term-message', data);
    });
};

module.exports = {
    addFunctions: addFunctions
};

