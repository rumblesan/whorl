/* @flow */

var addFunctions = function (Core, ScopeHandler, scope) {

    // time in ms
    var schedule = function(time, lambda) {
        Core.scheduleCallback(time, lambda);
    };
    ScopeHandler.addFF(scope, 'schedule', schedule);

};

module.exports = {
    addFunctions: addFunctions
};




