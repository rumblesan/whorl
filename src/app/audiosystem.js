/*jslint browser: true */
/*global AudioContext */

var createContext = function (w) {
    var context;
    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        context = new AudioContext();
    } catch(e) {
        throw "WebAudio API not available";
    }
    return context;
};

var createSystem = function (context) {
    var AudioSystem = {};

    AudioSystem.createBeep = function () {

    };

    AudioSystem.createSynth = function(
        voiceConstructor,
        envelopeConstructor,
        voiceNumber
    ) {
        var synth = {};
        var i;
        var voice, env;
        for (i = 0; i < voiceNumber; i += 1) {
            voice = voiceConstructor();
            env = envelopeConstructor();
        }
    };

    return AudioSystem;
};

module.exports = {
    createContext: createContext,
    createSystem: createSystem,
};
