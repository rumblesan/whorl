
var ScopeHandler = require('../../src/app/scopeHandler').create();
var Interpreter = require('../../src/app/interpreter').create(ScopeHandler);
var Parser = require('../../src/app/parser').create();

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

    'define adds value to scope': function (test) {
        var program = '(define a 3)';
        var ast = Parser.parse(program);
        var scope = ScopeHandler.createScope();
        Interpreter.evaluate(scope, ast);
        test.equal(ScopeHandler.get(scope, 'a'), 3);
        test.done();
    }
};

