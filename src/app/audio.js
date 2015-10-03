
const Thicket = require('thicket');

module.exports = {

    helpers: Thicket.helpers,

    AST: Thicket.AST,

    createContext: Thicket.createContext,

    createSystem: function (audioCtx) {

        const thicket = Thicket.createSystem(audioCtx);

        const masterOut = Thicket.AST.Amp(
            Thicket.AST.Compressor(
                Thicket.AST.Amp(
                    Thicket.AST.Input('master'),
                    0.4
                ),
                -50, 3, -20, -20, 0, 0.3
            ),
            Thicket.AST.Param('mastervolume', 0.5)
        );

        const system = {

            Synth: thicket.Synth,

            masterOut: thicket.Effects.create(masterOut)

        };

        thicket.Synth.connectToMasterOut(system.masterOut, 'default');

        return system;
    }

};

