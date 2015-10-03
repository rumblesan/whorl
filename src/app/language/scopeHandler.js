
import * as Error from '../error';
import * as Ast   from './ast';

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

export const addFF = (scope, name, func) => {
    scope[name] = Ast.BuiltIn(func);
};

