
export const LetDefinition = (name, expression) => {
    return {
        type: 'LETDEFINITION',
        name: name,
        expression: expression
    };
};

export const FunctionDefinition = (name, args, body) => {
    return {
        type: 'FUNCTIONDEFINITION',
        name: name,
        args: args,
        body: body
    };
};

export const Body = (definitions, expressions) => {
    return {
        type: 'BODY',
        definitions: definitions,
        expressions: expressions
    };
};

export const Variable = (name) => {
    return {
        type: 'VARIABLE',
        name: name
    };
};

export const Lambda = (argNames, body) => {
    return {
        type: 'LAMBDA',
        argNames: argNames,
        body: body
    };
};

export const If = (predicate, expression) => {
    return {
        type: 'IF',
        predicate: predicate,
        expression: expression
    };
};

export const IfElse = (predicate, trueExpression, falseExpression) => {
    return {
        type: 'IFELSE',
        predicate: predicate,
        trueExpression: trueExpression,
        falseExpression: falseExpression
    };
};

export const Application = (target, args) => {
    return {
        type: 'APPLICATION',
        target: target,
        args: args
    };
};

export const Undefined = () => {
    return {
        type: 'UNDEFINED',
        value: 'undefined'
    };
};

export const Bool = (value) => {
    return {
        type: 'BOOLEAN',
        value: value
    };
};

export const Num = (value) => {
    return {
        type: 'NUMBER',
        value: value
    };
};

export const Str = (value) => {
    return {
        type: 'STRING',
        value: value
    };
};

export const Symb = (value) => {
    return {
        type: 'SYMBOL',
        value: value
    };
};

export const Note = (note, octave) => {
    return {
        type: 'NOTE',
        value: `${note} in octave ${octave}`,
        note: note,
        octave: octave
    };
};

export const Beat = (value) => {
    return {
        type: 'BEAT',
        value: value
    };
};

export const List = (values) => {
    return {
        type: 'LIST',
        values: values
    };
};

export const Map = (entries) => {
    return {
        type: 'MAP',
        entries: entries
    };
};

export const MapPair = (key, value) => {
    return {
        type: 'MAPPAIR',
        key: key,
        value: value
    };
};

/* Applications
 * Not created by parser but by interpreter
 **/
export const Func = (argNames, body) => {
    return {
        type: 'FUNCTION',
        argNames: argNames,
        body: body
    };
};

export const BuiltIn = (func) => {
    return {
        type: 'BUILTIN',
        func: func
    };
};

export const Closure = (argNames, body, scope) => {
    return {
        type: 'CLOSURE',
        argNames: argNames,
        body: body,
        scope: scope
    };
};

