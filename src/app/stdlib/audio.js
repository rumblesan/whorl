
var Audio = require('../audio');

var addFunctions = function (audio, dispatcher, ScopeHandler, scope) {

    ScopeHandler.addFF(scope, 'input',
        function(name) {
            return Audio.AST.Input(name);
        }
    );

    ScopeHandler.addFF(scope, 'param',
        function(name, defaultValue) {
            return Audio.AST.Param(name, defaultValue);
        }
    );

    ScopeHandler.addFF(scope, 'mix',
        function(/* arguments */) {
            return Audio.AST.Mix.apply(this, arguments);
        }
    );

    ScopeHandler.addFF(scope, 'multiply',
        function(source, factor) {
            return Audio.AST.Multiply(source, factor);
        }
    );

    ScopeHandler.addFF(scope, 'arEnv',
        function(attack, decay) {
            return Audio.AST.AREnvelope(attack, decay);
        }
    );

    ScopeHandler.addFF(scope, 'osc',
        function(frequency, wave) {
            return Audio.AST.Oscillator(frequency, wave);
        }
    );

    ScopeHandler.addFF(scope, 'noise',
        function(noiseType) {
            return Audio.AST.Noise(noiseType);
        }
    );

    ScopeHandler.addFF(scope, 'filter',
        function(source, filterType, frequency, resonance) {
            return Audio.AST.Filter(source, filterType, frequency, resonance);
        }
    );

    ScopeHandler.addFF(scope, 'delay',
        function(source, delayTime, delayMax, feedback) {
            return Audio.AST.Delay(source, delayTime, delayMax, feedback);
        }
    );

    ScopeHandler.addFF(scope, 'compressor',
        function(source, threshold, ratio, knee, reduction, attack, release) {
            return Audio.AST.Compressor(source, threshold, ratio, knee, reduction, attack, release);
        }
    );

    ScopeHandler.addFF(scope, 'amp',
        function(source, volume) {
            return Audio.AST.Amp(source, volume);
        }
    );


    /**
     * Functions for playing built synths
     */
    ScopeHandler.addFF(scope, 'createSynth',
        function(dspGraph) {
            var s = audio.Synth.create(dspGraph);
            return s;
        }
    );

    ScopeHandler.addFF(scope, 'setParam',
        function(synth, paramName, paramValue) {
            audio.Synth.setParam(synth, paramName, paramValue);
        }
    );

    ScopeHandler.addFF(scope, 'getParam',
        function(synth, paramName) {
            return audio.Synth.getParam(synth, paramName);
        }
    );

    ScopeHandler.addFF(scope, 'start',
        function(synth, parameterList) {
            audio.Synth.start(synth, parameterList);
        }
    );

    ScopeHandler.addFF(scope, 'stop',
        function(synth) {
            audio.Synth.stop(synth);
        }
    );

    ScopeHandler.addFF(scope, 'play',
        function(synth, playLength) {
            audio.Synth.play(synth, playLength, []);
        }
    );

    ScopeHandler.addFF(scope, 'getInputs',
        function(synth, inputName) {
            audio.Synth.getInputs(synth, inputName);
        }
    );

    ScopeHandler.addFF(scope, 'getOutput',
        function(synth, outputName) {
            audio.Synth.getOutput(synth, outputName);
        }
    );

    ScopeHandler.addFF(scope, 'routeToMaster',
        function(sourceSynth) {
            console.log(audio.masterOut);
            audio.Synth.connectSynthToInput(
                audio.masterOut, 'master',
                sourceSynth, 'default'
            );
        }
    );

    // TODO Thicket should really be handling the name of the input
    ScopeHandler.addFF(scope, 'connectSynthToInput',
        function(synth, inputName, sourceSynth) {
            audio.Synth.connectSynthToInput(synth, inputName, sourceSynth, 'default');
        }
    );

    ScopeHandler.addFF(scope, 'connectToInput',
        function(synth, inputName, sourceSynth) {
            audio.Synth.connectToInput(synth, inputName, sourceSynth, 'default');
        }
    );

    ScopeHandler.addFF(scope, 'setMultiple',
        function(synth, parameterList) {
            var i;
            for (i = 0; i < parameterList.length; i += 2) {
                audio.Synth.setParam(
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

