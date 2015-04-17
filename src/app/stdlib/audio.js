
var addFunctions = function (Core, ScopeHandler, scope) {

    var arEnv = function(source, attack, decay) {
        return {
            type: 'ENVELOPE',
            source: source,
            attack: attack,
            decay: decay
        };
    };
    ScopeHandler.addFF(scope, 'arEnv', arEnv);

    var osc = function(wave) {
        return {
            type: 'OSCILLATOR',
            wave: wave
        };
    };
    ScopeHandler.addFF(scope, 'osc', osc);

    var createDSPGraph = function(graphRep) {
        var graph = Core.Audio.createDSPGraph(graphRep);
        Core.Audio.connectDSPGraph(graph);
        return graph;
    };
    ScopeHandler.addFF(scope, 'createDSPGraph', createDSPGraph);

    var play = function(dspGraph, playLength, freq) {
        Core.Audio.triggerGraph(dspGraph, playLength, freq);
    };
    ScopeHandler.addFF(scope, 'play', play);

};

module.exports = {
    addFunctions: addFunctions
};

