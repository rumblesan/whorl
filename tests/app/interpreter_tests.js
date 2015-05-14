
var ScopeHandler = require('../../src/app/scopeHandler').create();
var Interpreter = require('../../src/app/interpreter').create(ScopeHandler);
var Parser = require('../../src/app/parser').create();
var MathLib = require('../../src/app/stdlib/math');

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
        // Make sure that stdlib math functions are added to scope
        this.scope = ScopeHandler.createScope();
        MathLib.addFunctions({}, {}, ScopeHandler, this.scope);
        callback();
    },

    'let adds value to scope': function (test) {
        try {
            var program = '(let a 3)';
            var ast = Parser.parse(program);
            Interpreter.evaluate(this.scope, ast);
            test.equal(ScopeHandler.get(this.scope, 'a'), 3);
            test.done();
        } catch (e) {
            console.log(e);
            throw e;
        }
    },

    'def adds function to scope': function (test) {
        try {
            var program = '(def (sum a b) (+ a b))';
            var ast = Parser.parse(program);
            Interpreter.evaluate(this.scope, ast);
            test.ok(ScopeHandler.get(this.scope, 'sum'));
            test.done();
        } catch (e) {
            console.log(e);
            throw e;
        }
    },

    'user defined functions can be run': function (test) {
        try {
            var program = "(def (sum a b) (+ a b))\n(let c (sum 1 2))";
            var ast = Parser.parse(program);
            Interpreter.evaluate(this.scope, ast);
            test.ok(ScopeHandler.get(this.scope, 'sum'), 'sum function is in scope');
            test.equal(ScopeHandler.get(this.scope, 'c'), 3, 'function call result is 3');
            test.done();
        } catch (e) {
            console.log(e);
            throw e;
        }
    },

    'lambdas can be run': function (test) {
        try {
            var program = "(let l (lambda (a b) (+ a b)))\n(let c (l 1 2))";
            var ast = Parser.parse(program);
            Interpreter.evaluate(this.scope, ast);
            test.ok(ScopeHandler.get(this.scope, 'l'));
            test.equal(ScopeHandler.get(this.scope, 'c'), 3);
            test.done();
        } catch (e) {
            console.log(e);
            throw e;
        }
    },

    'notes can be defined': function (test) {
        try {
            var program = "(let n 'C#2)";
            var ast = Parser.parse(program);
            Interpreter.evaluate(this.scope, ast);
            test.ok(ScopeHandler.get(this.scope, 'n'), 'note value is defined');
            test.done();
        } catch (e) {
            console.log(e);
            throw e;
        }
    }


};

