
import * as Error   from '../error';
import * as Ast     from './ast';
import * as TypeAst from './typeAst';

export const createScope = () => {
    return {};
};

export const createChildScope = (parentScope) => {
    return Object.create(parentScope);
};

export const set = (scope, name, value) => {
    scope[name] = value;
};

export const get = (scope, name) => {
    const v = scope[name];
    if (v === undefined) {
        throw Error.create(Error.types.undefVar, `No variable with that name: ${name}`);
    } else {
        return v;
    }
};

/**
 * Type class and instance definition functions
 **/
export const instance = (scope, func) => {
    scope[func.name] = scope[func.name] || [];
    scope[func.name].push(func);
};

export const typeClass = () => {
};

export const addFF = (scope, name, func, argTypes) => {
    let types = [];
    if (argTypes === undefined) {
        let i;
        for (i = 0; i < func.length; i += 1) {
            types.push(TypeAst.Generic(String(i)));
        }
    } else {
        types = argTypes;
    }
    scope[name] = Ast.BuiltIn(func, types);
};

