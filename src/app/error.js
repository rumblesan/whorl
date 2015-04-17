

var createError = function (lines) {

    var WebSoundError = {};
    var errorLines = [];

    if ( typeof lines === 'string' ) {
        errorLines = [lines];
    } else {
        errorLines = lines;
    }

    WebSoundError.text = function () {
        return errorLines;
    };

    return WebSoundError;
};


module.exports = {
    create: createError
};
