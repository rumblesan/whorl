
import * as Audio        from '../audio';
import * as ScopeHandler from '../language/scopeHandler';

export const add = (audio, dispatcher, scope) => {

    ScopeHandler.addFF(scope, 'input',
        (name) => {
            return Audio.AST.Input(name);
        }
    );

    ScopeHandler.addFF(scope, 'param',
        (name, defaultValue) => {
            return Audio.AST.Param(name, defaultValue);
        }
    );

    ScopeHandler.addFF(scope, 'mix',
        (...args) => {
            return Audio.AST.Mix(...args);
        }
    );

    ScopeHandler.addFF(scope, 'multiply',
        (source, factor) => {
            return Audio.AST.Multiply(source, factor);
        }
    );

    ScopeHandler.addFF(scope, 'arEnv',
        (attack, decay) => {
            return Audio.AST.AREnvelope(attack, decay);
        }
    );

    ScopeHandler.addFF(scope, 'osc',
        (frequency, wave) => {
            return Audio.AST.Oscillator(frequency, wave);
        }
    );

    ScopeHandler.addFF(scope, 'noise',
        (noiseType) => {
            return Audio.AST.Noise(noiseType);
        }
    );

    ScopeHandler.addFF(scope, 'filter',
        (source, filterType, frequency, resonance) => {
            return Audio.AST.Filter(source, filterType, frequency, resonance);
        }
    );

    ScopeHandler.addFF(scope, 'delay',
        (source, delayTime, delayMax, feedback) => {
            return Audio.AST.Delay(source, delayTime, delayMax, feedback);
        }
    );

    ScopeHandler.addFF(scope, 'compressor',
        (source, threshold, ratio, knee, reduction, attack, release) => {
            return Audio.AST.Compressor(source, threshold, ratio, knee, reduction, attack, release);
        }
    );

    ScopeHandler.addFF(scope, 'amp',
        (source, volume) => {
            return Audio.AST.Amp(source, volume);
        }
    );


    /**
     * Functions for playing built synths
     */
    ScopeHandler.addFF(scope, 'createSynth',
        (dspGraph) => {
            return audio.Synth.create(dspGraph);
        }
    );

    ScopeHandler.addFF(scope, 'setParam',
        (synth, paramName, paramValue) => {
            audio.Synth.setParam(synth, paramName, paramValue);
        }
    );

    ScopeHandler.addFF(scope, 'getParam',
        (synth, paramName) => {
            return audio.Synth.getParam(synth, paramName);
        }
    );

    ScopeHandler.addFF(scope, 'start',
        (synth, parameterList) => {
            audio.Synth.start(synth, parameterList);
        }
    );

    ScopeHandler.addFF(scope, 'stop',
        (synth) => {
            audio.Synth.stop(synth);
        }
    );

    ScopeHandler.addFF(scope, 'play',
        (synth, playLength) => {
            audio.Synth.play(synth, playLength, []);
        }
    );

    ScopeHandler.addFF(scope, 'getInputs',
        (synth, inputName) => {
            audio.Synth.getInputs(synth, inputName);
        }
    );

    ScopeHandler.addFF(scope, 'getOutput',
        (synth, outputName) => {
            audio.Synth.getOutput(synth, outputName);
        }
    );

    ScopeHandler.addFF(scope, 'routeToMaster',
        (sourceSynth) => {
            audio.Synth.connectSynthToInputs(
                audio.masterOut, 'master',
                sourceSynth, 'default'
            );
        }
    );

    // TODO Thicket should really be handling the name of the input
    ScopeHandler.addFF(scope, 'connectSynthToInputs',
        (synth, inputName, sourceSynth) => {
            audio.Synth.connectSynthToInputs(synth, inputName, sourceSynth, 'default');
        }
    );

    ScopeHandler.addFF(scope, 'connectToInput',
        (synth, inputName, sourceSynth) => {
            audio.Synth.connectToInput(synth, inputName, sourceSynth, 'default');
        }
    );

    ScopeHandler.addFF(scope, 'setMultiple',
        (synth, parameterList) => {
            let i;
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

