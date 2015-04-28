/* @flow */

var Error = require('./error');
var Ast = require('./ast');

var createScopeHandler = function () {

    var ScopeHandler = {};

    ScopeHandler.createScope = function () {
        return {};
    };

    ScopeHandler.createChildScope = function (parentScope) {
        return Object.create(parentScope);
    };

    ScopeHandler.set = function (scope, name, value) {
        scope[name] = value;
    };

    ScopeHandler.get = function(scope, name) {
        var v = scope[name];
        if (v === undefined) {
            throw Error.create("No variable with that name: " + name);
        } else {
            return v;
        }
    };

    ScopeHandler.addFF = function (scope, name, func) {
        scope[name] = Ast.BuiltIn(func);
    };

    return ScopeHandler;

};

module.exports = {
    create: createScopeHandler
};

