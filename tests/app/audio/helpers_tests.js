
var AudioHelpers = require('../../../src/app/audio/helpers');

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

    'merging parameter nodes works correctly': function (test) {
        var paramNode1 = {
            params: ['param1', 'param2'],
            param1: [function (v) {
                return v;
            }],
            param2: [function (v) {
                return v;
            }],
        };
        var paramNode2 = {
            params: ['param2', 'param3'],
            param2: [function (v) {
                return v;
            }],
            param3: [function (v) {
                return v;
            }],
        };

        var merged = AudioHelpers.mergeNodeParams([paramNode1, paramNode2]);

        test.ok(merged.param1);
        test.ok(merged.param2);
        test.ok(merged.param3);
        test.equal(merged.params.length, 3);
        test.equal(merged.param1.length, 1);
        test.equal(merged.param2.length, 2);
        test.equal(merged.param3.length, 1);
        test.done();
    }

};


