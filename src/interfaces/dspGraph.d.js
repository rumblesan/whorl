
type DSPConstant = { type: string; value: number | string };
type DSPParam = { type: string; name: string; defaultValue: number | string };
type DSPAREnvelope = { type: string; attack: DSPConstant | DSPParam; decay: DSPConstant | DSPParam };
type DSPFilter = { type: string; source: DSPGraph; filterType: DSPConstant | DSPParam; frequency: DSPGraph; resonance: DSPConstant | DSPParam };
type DSPAmp = { type: string; source: DSPGraph; volume: DSPGraph };
type DSPOscillator = { type: string; frequency: DSPGraph; waveshape: DSPGraph };

type DSPGraph = DSPConstant | DSPParam | DSPAREnvelope | DSPFilter | DSPAmp | DSPOscillator;

