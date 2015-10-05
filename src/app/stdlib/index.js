
import * as MathFuncs    from './math';
import * as Comparison   from './comparison';
import * as Logic        from './logic';
import * as Timing       from './timing';
import * as Audio        from './audio';
import * as ScopeHandler from '../language/scopeHandler';
import * as Ast          from '../language/ast';
import * as TypeAst      from '../language/typeAst';

export const add = (audio, dispatcher, scope) => {

    MathFuncs.add(audio, dispatcher, scope);
    Comparison.add(audio, dispatcher, scope);
    Logic.add(audio, dispatcher, scope);
    Timing.add(audio, dispatcher, scope);
    Audio.add(audio, dispatcher, scope);

    ScopeHandler.addFF(scope, 'display',
        (data) => {
            dispatcher.dispatch('term-message', data);
            return Ast.Undefined();
        },
        [TypeAst.Generic('v')]
    );

};

