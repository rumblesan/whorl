/*jslint browser: true */
/*global AudioContext */

var Error = require('./error');

var createContext = function (w) {
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

    internal.createOsc = function (oscRep) {
        var oscillator = context.createOscillator();
        oscillator.type = oscRep.wave;
        oscillator.start();
        var play = function (freq) {
            oscillator.frequency.value = freq;
        };
        var stop = function () {
        };
        return {
            node: oscillator,
            play: play,
            stop: stop
        };
    }

    internal.createEnv = function (envRep) {
        var amp = context.createGain();
        amp.gain.value = 0;

        var source = AudioSystem.createDSPGraph(envRep.source);
        source.node.connect(amp);

        var play = function (freq) {
            source.play(freq);
            amp.gain.linearRampToValueAtTime(1, context.currentTime + envRep.attack);
        };
        var stop = function () {
            amp.gain.linearRampToValueAtTime(0, context.currentTime + envRep.decay);
            setTimeout(function () {
                source.stop();
            }, envRep.decay * 1000);
        };
        return {
            node: amp,
            play: play,
            stop: stop
        };
    };

    AudioSystem.createDSPGraph = function(graphRep) {
        var result;
        switch (graphRep.type) {
            case 'OSCILLATOR':
                result = internal.createOsc(graphRep);
                break;
            case 'ENVELOPE':
                result = internal.createEnv(graphRep);
                break;
            default:
                throw Error.create("Unknown DSP graph type: " + graphRep.type);
        }
        return result;
    };

    AudioSystem.connectDSPGraph = function(dspGraph) {
        dspGraph.node.connect(context.destination);
    };

    AudioSystem.triggerGraph = function(dspGraph, playLength, freq) {
        dspGraph.play(freq);
        setTimeout(function () {
            dspGraph.stop();
        }, playLength * 1000);
    };

    return AudioSystem;
};

module.exports = {
    createContext: createContext,
    createSystem: createSystem,
};
