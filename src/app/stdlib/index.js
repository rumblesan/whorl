
const MathFuncs = require('./math');
const Comparison = require('./comparison');
const Logic = require('./logic');
const Timing = require('./timing');
const Audio = require('./audio');

module.exports = {

    add: (audio, dispatcher, ScopeHandler, scope) => {
        MathFuncs.add(audio, dispatcher, ScopeHandler, scope);
        Comparison.add(audio, dispatcher, ScopeHandler, scope);
        Logic.add(audio, dispatcher, ScopeHandler, scope);
        Timing.add(audio, dispatcher, ScopeHandler, scope);
        Audio.add(audio, dispatcher, ScopeHandler, scope);

        ScopeHandler.addFF(scope, 'display', (data) => {
            dispatcher.dispatch('term-message', data);
        });
    }

};

