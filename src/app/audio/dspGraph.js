
var Error = require('../error');

var dsp = {};

var checkConst = function (v) {
    switch (typeof v) {
        case 'number':
            return dsp.Constant(v);
        case 'string':
            return dsp.Constant(v);
        default:
            if (v.type === undefined) {
                throw Error.create("Invalid value in DSP Graph: " + v);
            }
            // Assuming v is a DSP Graph
            return v;
    }
};

dsp.Constant = function (value) {
    return {
        type: 'CONSTANT',
        value: value
    };
};

dsp.Param = function (name, defaultValue) {
    return {
        type: 'PARAM',
        name: name,
        defaultValue: defaultValue
    };
};

dsp.AREnvelope = function (attack, decay) {
    return {
        type: 'ARENVELOPE',
        attack: checkConst(attack),
        decay: checkConst(decay)
    };
};

dsp.Oscillator = function(frequency, waveshape) {
    return {
        type: 'OSCILLATOR',
        frequency: checkConst(frequency),
        waveshape: checkConst(waveshape)
    };
};

dsp.Filter = function(source, filterType, frequency, resonance) {
    return {
        type: 'FILTER',
        source: source,
        filterType: checkConst(filterType),
        frequency: checkConst(frequency),
        resonance: checkConst(resonance)
    };
};

dsp.Amp = function(source, volume) {
    return {
        type: 'AMP',
        source: source,
        volume: checkConst(volume)
    };
};


module.exports = dsp;

