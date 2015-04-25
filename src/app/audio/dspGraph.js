
var Error = require('../error');

var DSPGraph = {};

var checkConst = function (v) {
    var out;
    switch (typeof v) {
        case 'number':
            out = DSPGraph.Constant(v);
            break;
        case 'string':
            out = DSPGraph.Constant(v);
            break;
        default:
            if (v.type !== undefined) {
                // Assuming v is a DSP Graph
                out = v;
            } else {
                throw Error.create("Invalid value in DSP Graph: " + v);
            }
    }
    return out;
};

DSPGraph.Constant = function (value) {
    return {
        type: 'CONSTANT',
        value: value
    };
};

DSPGraph.Param = function (name, defaultValue) {
    return {
        type: 'PARAM',
        name: name,
        defaultValue: defaultValue
    };
};

DSPGraph.AREnvelope = function (attack, decay) {
    return {
        type: 'ARENVELOPE',
        attack: checkConst(attack),
        decay: checkConst(decay)
    };
};

DSPGraph.Oscillator = function(frequency, wave) {
    return {
        type: 'OSCILLATOR',
        frequency: checkConst(frequency),
        wave: checkConst(wave)
    };
};

DSPGraph.Filter = function(source, filterType, frequency, resonance) {
    return {
        type: 'FILTER',
        source: source,
        filterType: checkConst(filterType),
        frequency: checkConst(frequency),
        resonance: checkConst(resonance)
    };
};

DSPGraph.Amp = function(source, volume) {
    return {
        type: 'AMP',
        source: source,
        volume: checkConst(volume)
    };
};


module.exports = DSPGraph;

