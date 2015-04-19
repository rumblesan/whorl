

var createError = function (lines) {

    var WebSoundError = {
        message: []
    };

    if ( typeof lines === 'string' ) {
        WebSoundError.message = [lines];
    } else {
        WebSoundError.message = lines;
    }

    return WebSoundError;
};


module.exports = {
    create: createError
};
