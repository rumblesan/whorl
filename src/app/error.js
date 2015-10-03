
export const create = function (type, message, details) {

    let InternalError = {
        internal: true,
        type: type,
        details: details,
        message: []
    };

    if ( typeof message === 'string' ) {
        InternalError.message = [message];
    } else {
        InternalError.message = message;
    }

    return InternalError;
};

export const types = {
    parse: 'Parse',
    undefVar: 'Undefined Variable',
    invalidAST: 'Invalid AST',
    application: 'Invalid Application'
};

