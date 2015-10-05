
import * as ScopeHandler from '../language/scopeHandler';
import * as Ast          from '../language/ast';
import * as TypeAst      from '../language/typeAst';

export const add = (audio, dispatcher, scope) => {
    ScopeHandler.addFF(scope, '+',
        (a, b) => { return Ast.Num(a.value + b.value); },
        [TypeAst.SimpleType('NUMBER'), TypeAst.SimpleType('NUMBER')]
    );
    ScopeHandler.addFF(scope, '-',
        (a, b) => { return Ast.Num(a.value - b.value); },
        [TypeAst.SimpleType('NUMBER'), TypeAst.SimpleType('NUMBER')]
    );
    ScopeHandler.addFF(scope, '*',
        (a, b) => { return Ast.Num(a.value * b.value); },
        [TypeAst.SimpleType('NUMBER'), TypeAst.SimpleType('NUMBER')]
    );
    ScopeHandler.addFF(scope, '/',
        (a, b) => { return Ast.Num(a.value / b.value); },
        [TypeAst.SimpleType('NUMBER'), TypeAst.SimpleType('NUMBER')]
    );
    ScopeHandler.addFF(scope, '^',
        (a, b) => { return Ast.Num(a.value ^ b.value); },
        [TypeAst.SimpleType('NUMBER'), TypeAst.SimpleType('NUMBER')]
    );
    ScopeHandler.addFF(scope, '%',
        (a, b) => { return Ast.Num(a.value % b.value); },
        [TypeAst.SimpleType('NUMBER'), TypeAst.SimpleType('NUMBER')]
    );

};

