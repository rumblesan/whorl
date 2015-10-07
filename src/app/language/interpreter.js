
import * as Error        from '../error';
import * as Ast          from './ast';
import * as ScopeHandler from './scopeHandler';
import * as TypeSystem   from './typeSystem';

const evaluateBlock = (scope, ast) => {
    return ast.map((expr) => {
        return evaluateExpression(scope, expr);
    });
};

const evaluateExpression = (scope, astExpr) => {

    let output;

    switch(astExpr.node) {
    case 'LETDEFINITION':
        output = handleLetDefinition(scope, astExpr);
        break;
    case 'FUNCTIONDEFINITION':
        output = handleFunctionDefinition(scope, astExpr);
        break;
    case 'BODY':
        output = handleBody(scope, astExpr);
        break;
    case 'VARIABLE':
        output = handleVariable(scope, astExpr);
        break;
    case 'LAMBDA':
        output = handleLambda(scope, astExpr);
        break;
    case 'IF':
        output = handleIf(scope, astExpr);
        break;
    case 'IFELSE':
        output = handleIfElse(scope, astExpr);
        break;
    case 'APPLICATION':
        output = handleApplicationExpression(scope, astExpr);
        break;
    case 'BOOLEAN':
        output = astExpr;
        break;
    case 'UNDEFINED':
        output = astExpr;
        break;
    case 'NUMBER':
        output = astExpr;
        break;
    case 'STRING':
        output = astExpr;
        break;
    case 'SYMBOL':
        output = astExpr;
        break;
    case 'NOTE':
        output = astExpr;
        break;
    case 'BEAT':
        output = astExpr;
        break;
    case 'LIST':
        output = handleList(scope, astExpr);
        break;
    case 'MAP':
        output = handleMap(scope, astExpr);
        break;
    case 'MAPPAIR':
        output = handleMapPair(scope, astExpr);
        break;
    default:
        throw Error.create(
            Error.types.invalidAST,
            `AST Expression not valid: ${astExpr.node}`
        );
    }
    return output;
};

const handleLetDefinition = (scope, define) => {
    const defName = define.name;
    const defValue = evaluateExpression(scope, define.expression);

    ScopeHandler.set(scope, defName, defValue);
    return defValue;
};

const handleFunctionDefinition = (scope, funcDef) => {
    const name      = funcDef.name;
    const argNames  = funcDef.argNames;
    const argTypes  = funcDef.argTypes;
    const body      = funcDef.body;
    const func      = Ast.Func(argNames, argTypes, body);

    ScopeHandler.set(scope, name, func);
    return func;
};

const handleBody = (scope, body) => {
    evaluateBlock(scope, body.definitions);
    return evaluateBlock(scope, body.expressions);
};

const handleVariable = (scope, variable) => {
    return ScopeHandler.get(scope, variable.name);
};

const handleLambda = (scope, lambda) => {
    return Ast.Closure(
        lambda.argNames,
        lambda.argTypes,
        lambda.body,
        scope
    );
};

const handleIf = (scope, ifNode) => {
    const predicate = evaluateExpression(scope, ifNode.predicate);
    let value;
    if (predicate === true || predicate !== 0) {
        value = evaluateBlock(scope, ifNode.expression);
    } else {
        value = false;
    }
    return value;
};

const handleIfElse = (scope, ifElse) => {
    const predicate = evaluateExpression(scope, ifElse.predicate);
    let value;
    if (predicate === true || predicate !== 0) {
        value = evaluateBlock(scope, ifElse.trueExpression);
    } else {
        value = evaluateBlock(scope, ifElse.falseExpression);
    }
    return value;
};

const handleApplicationExpression = (scope, application) => {
    const target = evaluateExpression(scope, application.target);
    const applicationArgs = application.args;

    const evaluatedArgs = applicationArgs.map((arg) => {
        return evaluateExpression(scope, arg);
    });

    return handleApplication(scope, target, evaluatedArgs);
};

const handleApplication = (scope, application, evaluatedArgs) => {
    if (!TypeSystem.checkFunctionTypes(application, evaluatedArgs)) {
        throw Error.create(
            Error.types.type,
            `Invalid types in application`
        );
    }
    let result;
    switch (application.node) {
    case 'FUNCTION':
        result = handleFunction(
            scope, application, evaluatedArgs
        );
        break;
    case 'BUILTIN':
        result = handleBuiltIn(
            scope, application, evaluatedArgs
        );
        break;
    case 'CLOSURE':
        result = handleFunction(
            application.scope, application, evaluatedArgs
        );
        break;
    default:
        throw Error.create(
            Error.types.application,
            `Application node not valid: ${application.node}`
        );
    }
    return result;
};

const handleFunction = (scope, func, functionArgs) => {
    const functionArgNames = func.argNames;
    const functionBody     = func.body;

    if (functionArgs.length !== functionArgNames.length) {
        throw Error.create(
            Error.types.application,
            'Incorrect argument number'
        );
    }

    let childScope = ScopeHandler.createChildScope(scope);
    for (let i = 0; i < functionArgNames.length; i += 1) {
        ScopeHandler.set(childScope, functionArgNames[i], functionArgs[i]);
    }

    return evaluateExpression(childScope, functionBody);
};

const handleBuiltIn = (scope, builtIn, functionArgs) => {
    const func = builtIn.func;

    if (functionArgs.length !== func.length) {
        throw Error.create(
            Error.types.application,
            'Incorrect argument number'
        );
    }

    const childScope = ScopeHandler.createChildScope(scope);
    // function args have already been evaluated
    return func.apply(childScope, functionArgs);
};

const handleList = (scope, list) => {
    return Ast.List(
        list.values.map((lExp) => {
            return evaluateExpression(scope, lExp);
        })
    );
};

const handleMap = (scope, map) => {
    return Ast.Map(
        map.entries.map((mExp) => {
            return evaluateExpression(scope, mExp);
        })
    );
};

const handleMapPair = (scope, pair) => {
    return {
        k: evaluateExpression(scope, pair.key),
        v: evaluateExpression(scope, pair.value)
    };
};

// scope is a dictionary, stored in and passed in by the Core
export const evaluate = (scope, ast) => {
    evaluateBlock(scope, ast);
};

export const apply = (scope, closure, args) => {
    handleApplication(scope, closure, args);
};

