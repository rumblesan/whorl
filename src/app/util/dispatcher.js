
export const create = () => {

    let callbacks = {};

    return {
        register: function (eventName, callback) {
            callbacks[eventName] = callbacks[eventName] || [];
            callbacks[eventName].push(callback);
        },

        dispatch: function (eventName , ...args) {
            const cbList = callbacks[eventName] || [];
            cbList.forEach((cb) => cb.apply({}, args));
        },

        unregister: function (eventName, callback) {
            const cbList = callbacks[eventName] || [];
            const cbId = cbList.indexOf(callback);
            if (cbId > -1) {
                cbList.splice(cbId, 1);
            }
        }
    };

};

