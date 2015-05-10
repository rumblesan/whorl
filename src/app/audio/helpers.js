
var helpers = {};

helpers.mergeNodeParams = function (paramNodes) {
    var output = {
        params: []
    };
    var node;
    var paramName;
    var n, p, pf;
    for (n = 0; n < paramNodes.length; n += 1) {
        node = paramNodes[n];
        for (p = 0; p < node.params.length; p += 1) {
            paramName = node.params[p];
            if (output[paramName] === undefined) {
                output[paramName] = [];
                output.params.push(paramName);
            }
            for (pf = 0; pf < node[paramName].length; pf += 1) {
                output[paramName].push(node[paramName][pf]);
            }
        }
    }
    return output;
};

module.exports = helpers;

