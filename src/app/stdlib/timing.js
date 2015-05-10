
var addFunctions = function (audio, dispatcher, ScopeHandler, scope) {

    // time in ms
    ScopeHandler.addFF(scope, 'schedule', function(time, closure) {
        dispatcher.dispatch('schedule-callback', time, closure);
    });

};

module.exports = {
    addFunctions: addFunctions
};




