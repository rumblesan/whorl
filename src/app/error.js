

var createError = function (lines) {

    var WebSoundError = {};
    var message = [];

    if ( typeof lines === 'string' ) {
        message = [lines];
    } else {
        message = lines;
    }

    return WebSoundError;
};


module.exports = {
    create: createError
};
