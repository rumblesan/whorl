
import * as Error from '../error';
import * as Ast   from './ast';

export const create = (ScopeHandler) => {

    let internal = {};

    internal.evaluateBlock = function (scope, ast) {
        return ast.map((expr) => {
            return internal.evaluateExpression(scope, expr);
        });
    };

    internal.evaluateExpression = function (scope, astExpr) {

        let output;

        switch(astExpr.type) {
        case 'LETDEFINITION':
            output = internal.handleLetDefinition(scope, astExpr);
            break;
        case 'FUNCTIONDEFINITION':
            output = internal.handleFunctionDefinition(scope, astExpr);
            break;
        case 'BODY':
            output = internal.handleBody(scope, astExpr);
            break;
        case 'VARIABLE':
            output = internal.handleVariable(scope, astExpr);
            break;
        case 'LAMBDA':
            output = internal.handleLambda(scope, astExpr);
            break;
        case 'IF':
            output = internal.handleIf(scope, astExpr);
            break;
        case 'IFELSE':
            output = internal.handleIfElse(scope, astExpr);
            break;
        case 'APPLICATION':
            output = internal.handleApplicationExpression(scope, astExpr);
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
            output = internal.handleList(scope, astExpr);
            break;
        case 'MAP':
            output = internal.handleMap(scope, astExpr);
            break;
        case 'MAPPAIR':
            output = internal.handleMapPair(scope, astExpr);
            break;
        default:
            throw Error.create(
                Error.types.invalidAST,
                `AST Expression not valid: ${astExpr.type}`
            );
        }
        return output;
    };

    internal.handleLetDefinition = function (scope, define) {
        const defName = define.name;
        const defValue = internal.evaluateExpression(scope, define.expression);

        ScopeHandler.set(scope, defName, defValue);
        return defValue;
    };

    internal.handleFunctionDefinition = function (scope, defineFunction) {
        const functionName = defineFunction.name;
        const functionArgNames = defineFunction.args;
        const functionBody = defineFunction.body;
        const functionValue = Ast.Func(functionArgNames, functionBody);

        ScopeHandler.set(scope, functionName, functionValue);
        return functionValue;
    };

    internal.handleBody = function (scope, body) {
        internal.evaluateBlock(scope, body.definitions);
        return internal.evaluateBlock(scope, body.expressions);
    };

    internal.handleVariable = function (scope, variable) {
        return ScopeHandler.get(scope, variable.name);
    };

    internal.handleLambda = function (scope, lambda) {
        return Ast.Closure(lambda.argNames, lambda.body, scope);
    };

    internal.handleIf = function (scope, ifNode) {
        const predicate = internal.evaluateExpression(scope, ifNode.predicate);
        let value;
        if (predicate === true || predicate !== 0) {
            value = internal.evaluateBlock(scope, ifNode.expression);
        } else {
            value = false;
        }
        return value;
    };

    internal.handleIfElse = function (scope, ifElse) {
        const predicate = internal.evaluateExpression(scope, ifElse.predicate);
        let value;
        if (predicate === true || predicate !== 0) {
            value = internal.evaluateBlock(scope, ifElse.trueExpression);
        } else {
            value = internal.evaluateBlock(scope, ifElse.falseExpression);
        }
        return value;
    };

    internal.handleApplicationExpression = function (scope, application) {
        const target = internal.evaluateExpression(scope, application.target);
        const applicationArgs = application.args;

        const evaluatedArgs = applicationArgs.map((arg) => {
            return internal.evaluateExpression(scope, arg);
        });

        return internal.handleApplication(scope, target, evaluatedArgs);
    };

    internal.handleApplication = function (scope, applicationData, evaluatedArgs) {
        let result;
        switch (applicationData.type) {
        case 'FUNCTION':
            result = internal.handleFunction(
                scope, applicationData, evaluatedArgs
            );
            break;
        case 'BUILTIN':
            result = internal.handleBuiltIn(
                scope, applicationData, evaluatedArgs
            );
            break;
        case 'CLOSURE':
            result = internal.handleFunction(
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

    internal.handleFunction = function(scope, func, functionArgs) {
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

        return internal.evaluateExpression(childScope, functionBody);
    };

    internal.handleBuiltIn = function(scope, builtIn, functionArgs) {
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

    internal.handleList = function (scope, list) {
        return list.values.map((lExp) => {
            return internal.evaluateExpression(scope, lExp);
        });
    };

    internal.handleMap = function (scope, map) {
        return map.entries.map((mExp) => {
            return internal.evaluateExpression(scope, mExp);
        });
    };

    internal.handleMapPair = function (scope, pair) {
        return {
            k: internal.evaluateExpression(scope, pair.key),
            v: internal.evaluateExpression(scope, pair.value)
        };
    };

    return {
        // scope is a dictionary, stored in and passed in by the Core
        evaluate: function (scope, ast) {
            internal.evaluateBlock(scope, ast);
        },

        apply: function(scope, closure, args) {
            internal.handleApplication(scope, closure, args);
        }
    };

};

