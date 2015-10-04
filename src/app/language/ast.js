
export const LetDefinition = (name, expression) => {
    return {
        node: 'LETDEFINITION',
        name: name,
        expression: expression
    };
};

export const FunctionDefinition = (name, args, body) => {
    return {
        node: 'FUNCTIONDEFINITION',
        name: name,
        args: args,
        body: body
    };
};

export const Body = (definitions, expressions) => {
    return {
        node: 'BODY',
        definitions: definitions,
        expressions: expressions
    };
};

export const Variable = (name) => {
    return {
        node: 'VARIABLE',
        name: name
    };
};

export const Lambda = (argNames, body) => {
    return {
        node: 'LAMBDA',
        argNames: argNames,
        body: body
    };
};

export const If = (predicate, expression) => {
    return {
        node: 'IF',
        predicate: predicate,
        expression: expression
    };
};

export const IfElse = (predicate, trueExpression, falseExpression) => {
    return {
        node: 'IFELSE',
        predicate: predicate,
        trueExpression: trueExpression,
        falseExpression: falseExpression
    };
};

export const Application = (target, args) => {
    return {
        node: 'APPLICATION',
        target: target,
        args: args
    };
};

export const Undefined = () => {
    return {
        node: 'UNDEFINED',
        value: 'undefined'
    };
};

export const Bool = (value) => {
    return {
        node: 'BOOLEAN',
        value: value
    };
};

export const Num = (value) => {
    return {
        node: 'NUMBER',
        value: value
    };
};

export const Str = (value) => {
    return {
        node: 'STRING',
        value: value
    };
};

export const Symb = (value) => {
    return {
        node: 'SYMBOL',
        value: value
    };
};

export const Note = (note, octave) => {
    return {
        node: 'NOTE',
        value: `${note} in octave ${octave}`,
        note: note,
        octave: octave
    };
};

export const Beat = (value) => {
    return {
        node: 'BEAT',
        value: value
    };
};

export const List = (values) => {
    return {
        node: 'LIST',
        values: values
    };
};

export const Map = (entries) => {
    return {
        node: 'MAP',
        entries: entries
    };
};

export const MapPair = (key, value) => {
    return {
        node: 'MAPPAIR',
        key: key,
        value: value
    };
};

/* Applications
 * Not created by parser but by interpreter
 **/
export const Func = (argNames, body) => {
    return {
        node: 'FUNCTION',
        argNames: argNames,
        body: body
    };
};

export const BuiltIn = (func) => {
    return {
        node: 'BUILTIN',
        func: func
    };
};

export const Closure = (argNames, body, scope) => {
    return {
        node: 'CLOSURE',
        argNames: argNames,
        body: body,
        scope: scope
    };
};

