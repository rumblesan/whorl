
export const LetDefinition = function (name, expression) {
    return {
        type: 'LETDEFINITION',
        name: name,
        expression: expression
    };
};

export const FunctionDefinition = function (name, args, body) {
    return {
        type: 'FUNCTIONDEFINITION',
        name: name,
        args: args,
        body: body
    };
};

export const Body = function (definitions, expressions) {
    return {
        type: 'BODY',
        definitions: definitions,
        expressions: expressions
    };
};

export const Variable = function (name) {
    return {
        type: 'VARIABLE',
        name: name
    };
};

export const Lambda = function (argNames, body) {
    return {
        type: 'LAMBDA',
        argNames: argNames,
        body: body
    };
};

export const If = function (predicate, expression) {
    return {
        type: 'IF',
        predicate: predicate,
        expression: expression
    };
};

export const IfElse = function (predicate, trueExpression, falseExpression) {
    return {
        type: 'IFELSE',
        predicate: predicate,
        trueExpression: trueExpression,
        falseExpression: falseExpression
    };
};

export const Application = function (target, args) {
    return {
        type: 'APPLICATION',
        target: target,
        args: args
    };
};

export const Undefined = function () {
    return {
        type: 'UNDEFINED',
        value: 'undefined'
    };
};

export const Bool = function (value) {
    return {
        type: 'BOOLEAN',
        value: value
    };
};

export const Num = function (value) {
    return {
        type: 'NUMBER',
        value: value
    };
};

export const Str = function (value) {
    return {
        type: 'STRING',
        value: value
    };
};

export const Symb = function (value) {
    return {
        type: 'SYMBOL',
        value: value
    };
};

export const Note = function (note, octave) {
    return {
        type: 'NOTE',
        value: `${note} in octave ${octave}`,
        note: note,
        octave: octave
    };
};

export const Beat = function (value) {
    return {
        type: 'BEAT',
        value: value
    };
};

export const List = function (values) {
    return {
        type: 'LIST',
        values: values
    };
};

export const Map = function (entries) {
    return {
        type: 'MAP',
        entries: entries
    };
};

export const MapPair = function (key, value) {
    return {
        type: 'MAPPAIR',
        key: key,
        value: value
    };
};

/* Applications
 * Not created by parser but by interpreter
 **/
export const Func = function (argNames, body) {
    return {
        type: 'FUNCTION',
        argNames: argNames,
        body: body
    };
};

export const BuiltIn = function (func) {
    return {
        type: 'BUILTIN',
        func: func
    };
};

export const Closure = function (argNames, body, scope) {
    return {
        type: 'CLOSURE',
        argNames: argNames,
        body: body,
        scope: scope
    };
};

