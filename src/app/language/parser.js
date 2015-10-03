
var JisonParser = require('../../generated/jison-parser').parser;
import * as Error from '../error';

var createParser = function () {

    var Parser = {};

    JisonParser.yy.parseError = function (message, details) {
        throw Error.create(
            Error.types.parse, message.split('\n'), details
        );
    };

    // Can raise an exception
    Parser.parse = function (code) {
        return JisonParser.parse(code);
    };

    return Parser;
};

module.exports = {
    create: createParser
};

