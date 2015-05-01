/* @flow */

var AudioHelpers = require('./audio/helpers');
var AudioGlobals = require('./audio/globals');
var Error = require('./error');

var createContext = function (w): WebAudioContext {
    var context;
    try {
        // Fix up for prefixing
        w.AudioContext = w.AudioContext||w.webkitAudioContext;
        context = new w.AudioContext();
    } catch(e) {
        throw Error.create("WebAudio API not available");
    }
    return context;
};

var createSystem = function (context) {
    var AudioSystem = {};

    var internal = {};

    internal.createConstant = function (audioTargetNode, graphRep) {
        audioTargetNode.set(graphRep.value);
        return {
            params: []
        };
    };

    internal.createParam = function (audioTargetNode, graphRep) {
        var paramName = graphRep.name;
        var defaultValue = graphRep.defaultValue;
        audioTargetNode.set(defaultValue);
        var paramParams = {};
        paramParams.params = [paramName];
        paramParams[paramName] = [
            function (newValue) {
                audioTargetNode.set(newValue);
            }
        ];
        return paramParams;
    };

    internal.createOscillator = function (audioTargetNode, graphRep) {
        var oscillator = context.createOscillator();
        oscillator.start();

        var waveParam = AudioSystem.evaluateDSPGraph(
            oscillator.getWaveParam(),
            graphRep.wave
        );

        var freqParam = AudioSystem.evaluateDSPGraph(
            oscillator.frequency,
            graphRep.frequency
        );

        oscillator.connect(audioTargetNode);

        return AudioHelpers.mergeNodeParams([waveParam, freqParam]);
    };

    internal.createEnvelope = function (audioTargetNode, graphRep) {

        var envParams = {};
        envParams.attack = {
            value: 0,
            set: function (newValue) {
                envParams.attack.value = newValue;
            },
            get: function () {
                return envParams.attack.value;
            }
        };
        envParams.decay = {
            value: 0,
            set: function (newValue) {
                envParams.decay.value = newValue;
            },
            get: function () {
                return envParams.decay.value;
            }
        };

        var attackParams = AudioSystem.evaluateDSPGraph(
            envParams.attack,
            graphRep.attack
        );

        var decayParams = AudioSystem.evaluateDSPGraph(
            envParams.decay,
            graphRep.decay
        );

        var trigger = function () {
            var t = context.currentTime + envParams.attack.value;
            audioTargetNode.linearRampToValueAtTime(
                1.0, t
            );
        };
        var stop = function () {
            var t = context.currentTime + envParams.decay.value;
            audioTargetNode.linearRampToValueAtTime(
                0.0, t
            );
        };
        var triggerParams = {
            params: ['trigger', 'stop'],
            trigger: [trigger],
            stop: [stop]
        };

        return AudioHelpers.mergeNodeParams([attackParams, decayParams, triggerParams]);
    };

    internal.createFilter = function (audioTargetNode, graphRep) {
        var filter = context.createBiquadFilter();

        var sourceParams = AudioSystem.evaluateDSPGraph(
            filter,
            graphRep.source
        );

        var filterTypeParam = AudioSystem.evaluateDSPGraph(
            filter.getFilterTypeParam(),
            graphRep.filterType
        );

        var freqParam = AudioSystem.evaluateDSPGraph(
            filter.frequency,
            graphRep.frequency
        );

        var resonanceParam = AudioSystem.evaluateDSPGraph(
            filter.Q,
            graphRep.resonance
        );

        filter.connect(audioTargetNode);

        return AudioHelpers.mergeNodeParams([sourceParams, filterTypeParam, freqParam, resonanceParam]);
    };

    internal.createAmp = function (audioTargetNode, graphRep) {
        var amp = context.createGain();
        amp.gain.value = 0;

        var sourceParams = AudioSystem.evaluateDSPGraph(
            amp,
            graphRep.source
        );

        var volumeParams = AudioSystem.evaluateDSPGraph(
            amp.gain,
            graphRep.volume
        );
        amp.connect(audioTargetNode);

        return AudioHelpers.mergeNodeParams([sourceParams, volumeParams]);
    };

    AudioSystem.evaluateDSPGraph = function(audioTargetNode, graphRep) {
        var result;
        switch (graphRep.type) {
            case 'CONSTANT':
                result = internal.createConstant(audioTargetNode, graphRep);
                break;
            case 'PARAM':
                result = internal.createParam(audioTargetNode, graphRep);
                break;
            case 'ARENVELOPE':
                result = internal.createEnvelope(audioTargetNode, graphRep);
                break;
            case 'OSCILLATOR':
                result = internal.createOscillator(audioTargetNode, graphRep);
                break;
            case 'FILTER':
                result = internal.createFilter(audioTargetNode, graphRep);
                break;
            case 'AMP':
                result = internal.createAmp(audioTargetNode, graphRep);
                break;
            default:
                throw Error.create("Unknown DSP graph type: " + graphRep.type);
        }
        return result;
    };

    /**
     * returns
     *     Synth: {
     *       params: [paramNames, ...],
     *       paramName1: [setFunctions, ...]
     *     }
     **/
    AudioSystem.createSynth = function (dspGraph) {
        return AudioSystem.evaluateDSPGraph(
            context.destination,
            dspGraph
        );
    };

    AudioSystem.setSynthParam = function (synth, paramName, value) {
        var i;
        if (synth[paramName] === undefined) {
            throw Error.create('Synth does not have ' + paramName + ' parameter');
        } else {
            for (i = 0; i < synth[paramName].length; i += 1) {
                synth[paramName][i](value);
            }
        }
    };

    AudioSystem.startSynth = function (synth, parameterList) {
        var i, t;
        var paramName, paramValue;
        if (synth.trigger === undefined) {
            throw Error.create('Synth does not have trigger parameter');
        } else {
            for (i = 0; i < parameterList.length; i += 2) {
                paramName  = parameterList[i];
                paramValue = parameterList[i+1];
                AudioSystem.setSynthParam(synth, paramName, paramValue);
            }
            for (t = 0; t < synth.trigger.length; t += 1) {
                synth.trigger[t]();
            }
        }
    };

    AudioSystem.stopSynth = function (synth) {
        var i, t;
        var paramName, paramValue;
        if (synth.stop === undefined) {
            throw Error.create('Synth does not have stop parameter');
        } else {
            for (t = 0; t < synth.stop.length; t += 1) {
                synth.stop[t]();
            }
        }
    };

    AudioSystem.playSynth = function (synth, length, parameterList) {
        var i, t;
        var paramName, paramValue;
        if (synth.trigger === undefined) {
            throw Error.create('Synth does not have trigger parameter');
        } else {
            for (i = 0; i < parameterList.length; i += 2) {
                paramName  = parameterList[i];
                paramValue = parameterList[i+1];
                AudioSystem.setSynthParam(synth, paramName, paramValue);
            }
            for (t = 0; t < synth.trigger.length; t += 1) {
                synth.trigger[t]();
            }
            setTimeout(function () {
                AudioSystem.stopSynth(synth);
            }, length * 1000);
        }
    };

    return AudioSystem;
};

module.exports = {
    createContext: createContext,
    createSystem: createSystem,
};
