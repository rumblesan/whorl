/* @flow */

var Error = require('../error');

type DSPConstant = { type: string; value: number | string };
type DSPParam = { type: string; name: string; defaultValue: number | string };
type DSPAREnvelope = { type: string; attack: DSPConstant | DSPParam; decay: DSPConstant | DSPParam };
type DSPFilter = { type: string; source: DSPGraph; filterType: DSPConstant | DSPParam; frequency: DSPGraph; resonance: DSPConstant | DSPParam };
type DSPAmp = { type: string; source: DSPGraph; volume: DSPGraph };
type DSPOscillator = { type: string; frequency: DSPGraph; waveshape: DSPGraph };

type DSPGraph = DSPConstant | DSPParam | DSPAREnvelope | DSPFilter | DSPAmp | DSPOscillator;

var dsp = {};

var checkConst = function (v: number | string | DSPGraph): any {
    switch (typeof v) {
        case 'number':
            return dsp.Constant(v);
        case 'string':
            return dsp.Constant(v);
        default:
            if (v.type !== undefined) {
                // Assuming v is a DSP Graph
                return v;
            } else {
                throw Error.create("Invalid value in DSP Graph: " + v);
            }
    }
};

dsp.Constant = function (value: number | string): DSPConstant {
    return {
        type: 'CONSTANT',
        value: value
    };
};

dsp.Param = function (name: string, defaultValue: number | string): DSPParam {
    return {
        type: 'PARAM',
        name: name,
        defaultValue: defaultValue
    };
};

dsp.AREnvelope = function (attack: DSPConstant | DSPParam, decay: DSPConstant | DSPParam): DSPAREnvelope {
    return {
        type: 'ARENVELOPE',
        attack: checkConst(attack),
        decay: checkConst(decay)
    };
};

dsp.Oscillator = function(frequency: DSPConstant | DSPGraph, waveshape: DSPConstant | DSPParam): DSPOscillator {
    return {
        type: 'OSCILLATOR',
        frequency: checkConst(frequency),
        waveshape: checkConst(waveshape)
    };
};

dsp.Filter = function(source: DSPGraph, filterType: DSPConstant | DSPParam, frequency: DSPGraph, resonance: DSPConstant | DSPParam): DSPFilter {
    return {
        type: 'FILTER',
        source: source,
        filterType: checkConst(filterType),
        frequency: checkConst(frequency),
        resonance: checkConst(resonance)
    };
};

dsp.Amp = function(source: DSPGraph, volume: DSPGraph): DSPAmp {
    return {
        type: 'AMP',
        source: source,
        volume: checkConst(volume)
    };
};


module.exports = dsp;

