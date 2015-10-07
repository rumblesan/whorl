
import * as ScopeHandler from '../language/scopeHandler';
import * as Ast          from '../language/ast';
import * as TypeAst      from '../language/typeAst';
import * as Error        from '../error';

export const toString = (astExpr) => {
    let output;
    switch(astExpr.node) {
    case 'BOOLEAN':
        output = String(astExpr.value);
        break;
    case 'UNDEFINED':
        output = 'Undefined';
        break;
    case 'NUMBER':
        output = String(astExpr.value);
        break;
    case 'STRING':
        output = String(astExpr.value);
        break;
    case 'SYMBOL':
        output = String(astExpr.value);
        break;
    case 'NOTE':
        output = String(astExpr.value);
        break;
    case 'BEAT':
        output = String(astExpr.value);
        break;
    case 'LIST':
        let els = astExpr.values.map(toString);
        output = `[${els}]`;
        break;
    case 'MAP':
        let mapKeys = astExpr.entries.map((e) => {
            return `(${toString(e.k)} -> ${toString(e.v)})`;
        });
        output = `{ ${mapKeys} }`;
        break;
    default:
        throw Error.create(
            Error.types.invalidAST,
            `AST Expression not valid: ${astExpr.node}`
        );
    }
    return output;
};

export const add = (audio, dispatcher, scope) => {
    ScopeHandler.addFF(scope, 'str',
        (v) => { return Ast.String(toString(v)); },
        [TypeAst.Generic('v')]
    );
};

