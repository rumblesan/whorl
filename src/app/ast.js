
module.exports = {

    LetDefinition: function (name, expression) {
        return {
            type: "LETDEFINITION",
            name: name,
            expression: expression
        };
    },

    FunctionDefinition: function (name, args, body) {
        return {
            type: "FUNCTIONDEFINITION",
            name: name,
            args: args,
            body: body
        };
    },

    Body: function (definitions, expressions) {
        return {
            type: "BODY",
            definitions: definitions,
            expressions: expressions
        };
    },

    Variable: function (name) {
        return {
            type: "VARIABLE",
            name: name
        };
    },

    Lambda: function (argNames, body) {
        return {
            type: "LAMBDA",
            argNames: argNames,
            body: body
        };
    },

    If: function (predicate, expression) {
        return {
            type: "IF",
            predicate: predicate,
            expression: expression
        };
    },

    IfElse: function (predicate, trueExpression, falseExpression) {
        return {
            type: "IFELSE",
            predicate: predicate,
            trueExpression: trueExpression,
            falseExpression: falseExpression
        };
    },

    Application: function (target, args) {
        return {
            type: "APPLICATION",
            target: target,
            args: args
        };
    },

    Bool: function (value) {
        return {
            type: "BOOLEAN",
            value: value
        };
    },

    Num: function (value) {
        return {
            type: "NUMBER",
            value: value
        };
    },

    Str: function (value) {
        return {
            type: "CHARACTER",
            value: value
        };
    },

    Symbol: function (value) {
        return {
            type: "SYMBOL",
            value: value
        };
    },

    Note: function (note, octave) {
        return {
            type: "NOTE",
            value: (note + " in octave " + octave),
            note: note,
            octave: octave
        };
    },

    Beat: function (value) {
        return {
            type: "BEAT",
            value: value
        };
    },

    List: function (values) {
        return {
            type: "LIST",
            values: values
        };
    },

    Map: function (entries) {
        return {
            type: "MAP",
            entries: entries
        };
    },

    MapPair: function (key, value) {
        return {
            type: "MAPPAIR",
            key: key,
            value: value
        };
    },

    /* Applications
     * Not created by parser but by interpreter
     **/
    Func: function (argNames, body) {
        return {
            type: "FUNCTION",
            argNames: argNames,
            body: body
        };
    },

    BuiltIn: function (func) {
        return {
            type: "BUILTIN",
            func: func
        };
    },

    Closure: function (argNames, body, scope) {
        return {
            type: "CLOSURE",
            argNames: argNames,
            body: body,
            scope: scope
        };
    }

};

