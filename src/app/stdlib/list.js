
import * as ScopeHandler from '../language/scopeHandler';
import * as Error        from '../error';
import * as Ast          from '../language/ast';

export const add = (audio, dispatcher, scope) => {

    ScopeHandler.addFF(scope, 'head', (list) => {
        if (list.type !== 'LIST') {
            throw Error.create(
                Error.types.application,
                'Expression is not a list'
            );
        } else if (list.values.length === 0) {
            return Ast.Undefined();
        } else {
            return list.values[0];
        }
    });

    ScopeHandler.addFF(scope, 'tail', (list) => {
        if (list.type !== 'LIST') {
            throw Error.create(
                Error.types.application,
                'Expression is not a list'
            );
        } else if (list.values.length === 0) {
            return Ast.List([]);
        } else {
            return Ast.List(list.values.slice(1));
        }
    });

};


