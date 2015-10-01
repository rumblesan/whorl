
var Thicket = require('thicket');

var Audio = {};

Audio.helpers = Thicket.helpers;

Audio.AST = Thicket.AST;

Audio.createContext = Thicket.createContext;

Audio.createSystem = function (audioCtx) {

    var thicket = Thicket.createSystem(audioCtx);

    var system = {};

    system.Synth = thicket.Synth;

    var masterOut = Audio.AST.Amp(
        Audio.AST.Compressor(
            Audio.AST.Amp(
                Audio.AST.Input('master'),
                0.4
            ),
            -50, 3, -20, -20, 0, 0.3
        ),
        Audio.AST.Param('mastervolume', 0.5)
    );

    system.masterOut = thicket.Effects.create(masterOut);
    thicket.Synth.connectToMasterOut(system.masterOut, 'default');

    return system;
};

module.exports = Audio;

