
export const add = (audio, dispatcher, ScopeHandler, scope) => {
    // time in ms
    ScopeHandler.addFF(scope, 'schedule', (time, closure) => {
        dispatcher.dispatch('schedule-callback', time, closure);
    });
};


