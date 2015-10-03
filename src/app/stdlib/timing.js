
import * as ScopeHandler from '../language/scopeHandler';

export const add = (audio, dispatcher, scope) => {
    // time in ms
    ScopeHandler.addFF(scope, 'schedule', (time, closure) => {
        dispatcher.dispatch('schedule-callback', time, closure);
    });
};


