
var JisonParser = require('../generated/jison-parser').parser;
var Error = require('./error');

var createParser = function () {

    var Parser = {};

    JisonParser.yy.parseError = function (message, details) {
        throw Error.create(message.split("\n"));
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

