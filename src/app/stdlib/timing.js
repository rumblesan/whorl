
import * as ScopeHandler from '../language/scopeHandler';
import * as Ast          from '../language/ast';
import * as TypeAst      from '../language/typeAst';

export const add = (audio, dispatcher, scope) => {
    // time in ms
    ScopeHandler.addFF(scope, 'schedule',
        (time, closure) => {
            dispatcher.dispatch('schedule-callback', time.value, closure);
            return Ast.Undefined();
        },
        [TypeAst.SimpleType('NUMBER'), TypeAst.Generic('func')]
    );
};


