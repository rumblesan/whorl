
import * as Error from '../error';
import * as Ast   from './ast';

export const createScope = function () {
    return {};
};

export const createChildScope = function (parentScope) {
    return Object.create(parentScope);
};

export const set = function (scope, name, value) {
    scope[name] = value;
};

export const get = function(scope, name) {
    var v = scope[name];
    if (v === undefined) {
        throw Error.create(Error.types.undefVar, `No variable with that name: ${name}`);
    } else {
        return v;
    }
};

export const addFF = function (scope, name, func) {
    scope[name] = Ast.BuiltIn(func);
};

