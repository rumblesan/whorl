/* @flow */

type InternalError = { internal: boolean; message: [string] };

var createError = function (lines: string | [string]): InternalError  {

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
