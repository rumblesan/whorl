
var DspGraph = require('../audio/dspGraph');

var addFunctions = function (Core, ScopeHandler, scope) {

    ScopeHandler.addFF(scope, 'param',
        function(name, defaultValue) {
            return DspGraph.Param(name, defaultValue);
        }
    );

    ScopeHandler.addFF(scope, 'arEnv',
        function(attack, decay) {
            return DspGraph.AREnvelope(attack, decay);
        }
    );

    ScopeHandler.addFF(scope, 'osc',
        function(frequency, wave) {
            return DspGraph.Oscillator(frequency, wave);
        }
    );

    ScopeHandler.addFF(scope, 'filter',
        function(source, filterType, frequency, resonance) {
            return DspGraph.Filter(source, filterType, frequency, resonance);
        }
    );

    ScopeHandler.addFF(scope, 'amp',
        function(source, volume) {
            return DspGraph.Amp(source, volume);
        }
    );


    ScopeHandler.addFF(scope, 'createSynth',
        function(dspGraph) {
            return Core.Audio.createSynth(dspGraph);
        }
    );

    ScopeHandler.addFF(scope, 'play',
        function(synth, playLength) {
            Core.Audio.playSynth(synth, playLength, []);
        }
    );

    ScopeHandler.addFF(scope, 'start',
        function(synth, parameterList) {
            Core.Audio.startSynth(synth, parameterList);
        }
    );

    ScopeHandler.addFF(scope, 'stop',
        function(synth) {
            Core.Audio.stopSynth(synth);
        }
    );

    ScopeHandler.addFF(scope, 'set',
        function(synth, paramName, paramValue) {
            Core.Audio.setSynthParam(synth, paramName, paramValue);
        }
    );

    ScopeHandler.addFF(scope, 'setMultiple',
        function(synth, parameterList) {
            var i;
            for (i = 0; i < parameterList.length; i += 2) {
                Core.Audio.setSynthParam(
                    synth,
                    parameterList[i],
                    parameterList[i+1]
                );
            }
        }
    );

};

module.exports = {
    addFunctions: addFunctions
};

