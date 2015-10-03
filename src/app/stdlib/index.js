
import * as MathFuncs   from './math';
import * as Comparison  from './comparison';
import * as Logic       from './logic';
import * as Timing      from './timing';
import * as Audio       from './audio';

export const add = (audio, dispatcher, ScopeHandler, scope) => {
    MathFuncs.add(audio, dispatcher, ScopeHandler, scope);
    Comparison.add(audio, dispatcher, ScopeHandler, scope);
    Logic.add(audio, dispatcher, ScopeHandler, scope);
    Timing.add(audio, dispatcher, ScopeHandler, scope);
    Audio.add(audio, dispatcher, ScopeHandler, scope);

    ScopeHandler.addFF(scope, 'display', (data) => {
        dispatcher.dispatch('term-message', data);
    });

};

