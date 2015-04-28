/* @flow */

var addFunctions = function (Core, ScopeHandler, scope) {

    var equal = function (a, b) {
        return a === b;
    };
    ScopeHandler.addFF(scope, '==', equal);

    var notEqual = function (a, b) {
        return a !== b;
    };
    ScopeHandler.addFF(scope, '!=', equal);

    var greaterThan = function (a, b) {
        return a > b;
    };
    ScopeHandler.addFF(scope, '>', greaterThan);

    var lessThan = function (a, b) {
        return a < b;
    };
    ScopeHandler.addFF(scope, '<', lessThan);

    var greaterThanEq = function (a, b) {
        return a >= b;
    };
    ScopeHandler.addFF(scope, '>=', greaterThanEq);

    var lessThanEq = function (a, b) {
        return a <= b;
    };
    ScopeHandler.addFF(scope, '<=', lessThanEq);

};

module.exports = {
    addFunctions: addFunctions
};


