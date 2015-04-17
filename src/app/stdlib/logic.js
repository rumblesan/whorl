
var addFunctions = function (Core, ScopeHandler, scope) {

    var logicalAnd = function (a, b) {
        return (a && b);
    };
    ScopeHandler.addFF(scope, '&&', logicalAnd);

    var logicalOr = function (a, b) {
        return (a || b);
    };
    ScopeHandler.addFF(scope, '||', logicalOr);

    var logicalNot = function (a) {
        return (! a);
    };
    ScopeHandler.addFF(scope, '!', logicalNot);

};

module.exports = {
    addFunctions: addFunctions
};

