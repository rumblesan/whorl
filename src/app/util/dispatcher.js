
export const create = () => {

    let DispatcherObj = {};
    let callbacks = {};

    DispatcherObj.register = function (eventName, callback) {
        callbacks[eventName] = callbacks[eventName] || [];
        callbacks[eventName].push(callback);
    };

    DispatcherObj.dispatch = function (eventName , ...args) {
        const cbList = callbacks[eventName] || [];
        cbList.map((cb) => cb.apply({}, args));
    };

    DispatcherObj.unregister = function (eventName, callback) {
        const cbList = callbacks[eventName] || [];
        const cbId = cbList.indexOf(callback);
        if (cbId > -1) {
            cbList.splice(cbId, 1);
        }
    };

    return DispatcherObj;

};

