/* @flow */

var Error = require('./error');
var Ast = require('./ast');

var createInterpreter = function (ScopeHandler) {

    var Interpreter = {};
    var internal = {};

    // scope is a dictionary, stored in and passed in by the Core
    Interpreter.evaluate = function (scope, ast) {
        internal.evaluateBlock(scope, ast);
    };

    Interpreter.apply = function(scope, closure, args) {
        internal.handleApplication(scope, closure, args);
    };

    internal.evaluateBlock = function (scope, ast) {
        var i, r, expr, results = [];
        for (i = 0; i < ast.length; i += 1) {
            expr = ast[i];
            r = internal.evaluateExpression(scope, expr);
            results.push(r);
        }
        return results;
    };

    internal.evaluateExpression = function (scope, astExpr) {

        var output;

        switch(astExpr.type) {
            case "DEFINE":
                output = internal.handleDefine(scope, astExpr);
                break;
            case "DEFINEFUNCTION":
                output = internal.handleDefineFunction(scope, astExpr);
                break;
            case "BODY":
                output = internal.handleBody(scope, astExpr);
                break;
            case "VARIABLE":
                output = internal.handleVariable(scope, astExpr);
                break;
            case "LAMBDA":
                output = internal.handleLambda(scope, astExpr);
                break;
            case "IF":
                output = internal.handleIf(scope, astExpr);
                break;
            case "IFELSE":
                output = internal.handleIfElse(scope, astExpr);
                break;
            case "APPLICATION":
                output = internal.handleApplicationExpression(scope, astExpr);
                break;
            case "BOOLEAN":
                output = astExpr.value;
                break;
            case "NUMBER":
                output = astExpr.value;
                break;
            case "CHARACTER":
                output = astExpr.value;
                break;
            case "STRING":
                output = astExpr.value;
                break;
            case "SYMBOL":
                output = astExpr.value;
                break;
            case "LIST":
                output = internal.handleList(scope, astExpr);
                break;
            default:
                throw Error.create("AST Expression not valid: " + astExpr.type);
        }
        return output;
    };

    internal.handleDefine = function (scope, define) {
        var defName = define.name;
        var defValue = internal.evaluateExpression(scope, define.expression);

        ScopeHandler.set(scope, defName, defValue);
        return defValue;
    };

    internal.handleDefineFunction = function (scope, defineFunction) {
        var functionName = defineFunction.name;
        var functionArgNames = defineFunction.args;
        var functionBody = defineFunction.body;
        var functionValue = Ast.Func(functionArgNames, functionBody);

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
        var predicate = internal.evaluateExpression(scope, ifNode.predicate);
        var value;
        if (predicate === true || predicate !== 0) {
            value = internal.evaluateBlock(scope, ifNode.expression);
        } else {
            value = false;
        }
        return value;
    };

    internal.handleIfElse = function (scope, ifElse) {
        var predicate = internal.evaluateExpression(scope, ifElse.predicate);
        var value;
        if (predicate === true || predicate !== 0) {
            value = internal.evaluateBlock(scope, ifElse.trueExpression);
        } else {
            value = internal.evaluateBlock(scope, ifElse.falseExpression);
        }
        return value;
    };

    internal.handleApplicationExpression = function (scope, application) {
        var target = internal.evaluateExpression(scope, application.target);
        var applicationArgs = application.args;

        var evaluatedArgs = [];
        var i;
        for (i = 0; i < applicationArgs.length; i += 1) {
            evaluatedArgs.push(
                internal.evaluateExpression(scope, applicationArgs[i])
            );
        }

        return internal.handleApplication(scope, target, evaluatedArgs);
    };

    internal.handleApplication = function (scope, applicationData, evaluatedArgs) {
        var result;
        switch (applicationData.type) {
            case "FUNCTION":
                result = internal.handleFunction(
                    scope, applicationData, evaluatedArgs
                );
                break;
            case "BUILTIN":
                result = internal.handleBuiltIn(
                    scope, applicationData, evaluatedArgs
                );
                break;
            case "CLOSURE":
                result = internal.handleFunction(
                    applicationData.scope, applicationData, evaluatedArgs
                );
                break;
            default:
                throw Error.create(
                    "Application type not valid: " + applicationData.type
                );
        }
        return result;
    };

    internal.handleFunction = function(scope, func, functionArgs) {
        var functionArgNames = func.argNames;
        var functionBody     = func.body;

        if (functionArgs.length !== functionArgNames.length) {
            throw Error.create("Incorrect argument number");
        }

        var childScope = ScopeHandler.createChildScope(scope);
        var i;
        for (i = 0; i < functionArgNames.length; i += 1) {
            ScopeHandler.set(childScope, functionArgNames[i], functionArgs[i]);
        }

        return internal.evaluateExpression(childScope, functionBody);
    };

    internal.handleBuiltIn = function(scope, builtIn, functionArgs) {
        var func = builtIn.func;

        if (functionArgs.length !== func.length) {
            throw Error.create("Incorrect argument number");
        }

        var childScope = ScopeHandler.createChildScope(scope);
        // function args have already been evaluated
        return func.apply(childScope, functionArgs);
    };

    internal.handleList = function (scope, list) {
        var i, r, listExpressions = list.values, results = [];
        for (i = 0; i < listExpressions.length; i += 1) {
            r = internal.evaluateExpression(scope, listExpressions[i]);
            results.push(r);
        }
        return results;
    };

    return Interpreter;
};

module.exports = {
    create: createInterpreter
};

