
import * as Error        from '../error';
import * as Ast          from './ast';
import * as ScopeHandler from './scopeHandler';

const evaluateBlock = (scope, ast) => {
    return ast.map((expr) => {
        return evaluateExpression(scope, expr);
    });
};

const evaluateExpression = (scope, astExpr) => {

    let output;

    switch(astExpr.type) {
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
        output = astExpr.value;
        break;
    case 'UNDEFINED':
        output = astExpr.value;
        break;
    case 'NUMBER':
        output = astExpr.value;
        break;
    case 'STRING':
        output = astExpr.value;
        break;
    case 'SYMBOL':
        output = astExpr.value;
        break;
    case 'NOTE':
        output = astExpr.value;
        break;
    case 'BEAT':
        output = astExpr.value;
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
            `AST Expression not valid: ${astExpr.type}`
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

const handleFunctionDefinition = (scope, defineFunction) => {
    const functionName = defineFunction.name;
    const functionArgNames = defineFunction.args;
    const functionBody = defineFunction.body;
    const functionValue = Ast.Func(functionArgNames, functionBody);

    ScopeHandler.set(scope, functionName, functionValue);
    return functionValue;
};

const handleBody = (scope, body) => {
    evaluateBlock(scope, body.definitions);
    return evaluateBlock(scope, body.expressions);
};

const handleVariable = (scope, variable) => {
    return ScopeHandler.get(scope, variable.name);
};

const handleLambda = (scope, lambda) => {
    return Ast.Closure(lambda.argNames, lambda.body, scope);
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

const handleApplication = (scope, applicationData, evaluatedArgs) => {
    let result;
    switch (applicationData.type) {
    case 'FUNCTION':
        result = handleFunction(
            scope, applicationData, evaluatedArgs
        );
        break;
    case 'BUILTIN':
        result = handleBuiltIn(
            scope, applicationData, evaluatedArgs
        );
        break;
    case 'CLOSURE':
        result = handleFunction(
            applicationData.scope, applicationData, evaluatedArgs
        );
        break;
    default:
        throw Error.create(
            Error.types.application,
            `Application type not valid: ${applicationData.type}`
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
    return list.values.map((lExp) => {
        return evaluateExpression(scope, lExp);
    });
};

const handleMap = (scope, map) => {
    return map.entries.map((mExp) => {
        return evaluateExpression(scope, mExp);
    });
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

