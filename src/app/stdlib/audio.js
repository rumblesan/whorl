/* @flow */

var DspGraph = require('../audio/dspGraph');

var addFunctions = function (audio, dispatcher, ScopeHandler, scope) {

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
            return audio.createSynth(dspGraph);
        }
    );

    ScopeHandler.addFF(scope, 'play',
        function(synth, playLength) {
            audio.playSynth(synth, playLength, []);
        }
    );

    ScopeHandler.addFF(scope, 'start',
        function(synth, parameterList) {
            audio.startSynth(synth, parameterList);
        }
    );

    ScopeHandler.addFF(scope, 'stop',
        function(synth) {
            audio.stopSynth(synth);
        }
    );

    ScopeHandler.addFF(scope, 'set',
        function(synth, paramName, paramValue) {
            audio.setSynthParam(synth, paramName, paramValue);
        }
    );

    ScopeHandler.addFF(scope, 'setMultiple',
        function(synth, parameterList) {
            var i;
            for (i = 0; i < parameterList.length; i += 2) {
                audio.setSynthParam(
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

