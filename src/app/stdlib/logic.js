
import * as ScopeHandler from '../language/scopeHandler';
import * as Ast          from '../language/ast';
import * as TypeAst      from '../language/typeAst';

export const add = (audio, dispatcher, scope) => {
    ScopeHandler.addFF(scope, '&&',
        (a, b) => { return Ast.Bool(a.value && b.value); },
        [TypeAst.SimpleType('BOOLEAN'), TypeAst.SimpleType('BOOLEAN')]
    );
    ScopeHandler.addFF(scope, '||',
        (a, b) => { return Ast.Bool(a.value || b.value); },
        [TypeAst.SimpleType('BOOLEAN'), TypeAst.SimpleType('BOOLEAN')]
    );
    ScopeHandler.addFF(scope, '!',
        (a) => { return Ast.Bool(! a.value); },
        [TypeAst.SimpleType('BOOLEAN')]
    );
};

