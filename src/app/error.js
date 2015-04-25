

var createError = function (lines) {

    var InternalError = {
        internal: true,
        message: []
    };

    if ( typeof lines === 'string' ) {
        InternalError.message = [lines];
    } else {
        InternalError.message = lines;
    }

    return InternalError;
};


module.exports = {
    create: createError
};
