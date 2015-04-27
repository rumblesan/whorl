/*global require */

var createDispatcher = function () {

    var Dispatcher = {};
    var callbacks = {};

    Dispatcher.register = function (eventName, callback) {
        callbacks[eventName] = callbacks[eventName] || [];
        callbacks[eventName].push(callback);
    };

    Dispatcher.dispatch = function (eventName /* , args... */) {
        var i;
        var cbList = callbacks[eventName] || [];
        for (i = 0; i < cbList.length; i += 1) {
            cbList[i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    };

    Dispatcher.unregister = function (eventName, callback) {
        var cbList = callbacks[eventName];
        var fIds = cbList.indexOf(callback);
        if (fIds > -1) {
            cbList.splice(fIds, 1);
        }
    };

    return Dispatcher;

};

module.exports = {
    create: createDispatcher
};
