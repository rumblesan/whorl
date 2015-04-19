
var ScopeHandler = require('../../src/app/scopeHandler').create();
var Interpreter = require('../../src/app/interpreter').create(ScopeHandler);
var Parser = require('../../src/app/parser').create();
var StdLib = require('../../src/app/stdLib');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

module.exports = {

    setUp: function (callback) {
        // Make sure that stdlib functions are added to scope
        var Core = {};
        this.scope = ScopeHandler.createScope();
        StdLib.addFunctions(Core, ScopeHandler, this.scope);
        callback();
    },

    'define adds value to scope': function (test) {
        var program = '(define a 3)';
        var ast = Parser.parse(program);
        Interpreter.evaluate(this.scope, ast);
        test.equal(ScopeHandler.get(this.scope, 'a'), 3);
        test.done();
    },

    'define function adds function to scope': function (test) {
        var program = '(define (sum a b) (+ a b))';
        var ast = Parser.parse(program);
        Interpreter.evaluate(this.scope, ast);
        test.ok(ScopeHandler.get(this.scope, 'sum'));
        test.done();
    },

    'defined functions can be run': function (test) {
        var program = "(define (sum a b) (+ a b))\n(define c (sum 1 2))";
        var ast = Parser.parse(program);
        Interpreter.evaluate(this.scope, ast);
        test.ok(ScopeHandler.get(this.scope, 'sum'));
        test.equal(ScopeHandler.get(this.scope, 'c'), 3);
        test.done();
    },

    'lambdas can be run': function (test) {
        var program = "(define l (lambda (a b) (+ a b)))\n(define c (l 1 2))";
        var ast = Parser.parse(program);
        Interpreter.evaluate(this.scope, ast);
        test.ok(ScopeHandler.get(this.scope, 'l'));
        test.equal(ScopeHandler.get(this.scope, 'c'), 3);
        test.done();
    }


};

