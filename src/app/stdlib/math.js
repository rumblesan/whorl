
var addFunctions = function (Core, ScopeHandler, scope) {

    var plus = function (a, b) {
        return a + b;
    };
    ScopeHandler.addFF(scope, '+', plus);

    var minus = function (a, b) {
        return a - b;
    };
    ScopeHandler.addFF(scope, '-', minus);

    var multiply = function (a, b) {
        return a * b;
    };
    ScopeHandler.addFF(scope, '*', multiply);

    var divide = function (a, b) {
        return a / b;
    };
    ScopeHandler.addFF(scope, '/', divide);

    var exponent = function (a, b) {
        return a ^ b;
    };
    ScopeHandler.addFF(scope, '^', exponent);

    var modulo = function (a, b) {
        return a % b;
    };
    ScopeHandler.addFF(scope, '%', modulo);


};

module.exports = {
    addFunctions: addFunctions
};

