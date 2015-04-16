/*global require */

var JisonParser = require('../jison-parser').parser;

var createParser = function () {

    var Parser = {};

    JisonParser.yy.parseError = function (message, details) {
        throw [message, details];
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


