/*global require */

var Error = require('./error');

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

        var exprType = astExpr[0];
        var output;

        switch(exprType) {
            case "BEGIN":
                output = internal.handleBegin(scope, astExpr);
                break;
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
            case "QUOTE":
                output = internal.handleQuote(scope, astExpr);
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
            case "SET":
                output = internal.handleSet(scope, astExpr);
                break;
            case "APPLICATION":
                output = internal.handleApplicationExpression(scope, astExpr);
                break;
            case "BOOLEAN":
                if (astExpr[1] === "TRUE") {
                    output = true;
                } else {
                    output = false;
                }
                break;
            case "NUMBER":
                output = astExpr[1];
                break;
            case "CHARACTER":
                output = astExpr[1];
                break;
            case "STRING":
                output = astExpr[1];
                break;
            case "SYMBOL":
                output = astExpr[1];
                break;
            case "LIST":
                output = internal.handleList(scope, astExpr);
                break;
            case "VECTOR":
                output = internal.handleVector(scope, astExpr);
                break;
            default:
                Error.create("exprType not valid: " + exprType);
        }
        return output;
    };

    internal.handleBegin = function (scope, exprTree) {
        var defines = exprTree[1];
        return internal.evaluateBlock(scope, defines);
    };

    internal.handleDefine = function (scope, exprTree) {
        var varName = exprTree[1];
        var varValue = internal.evaluateExpression(scope, exprTree[2]);

        ScopeHandler.set(scope, varName, varValue);
        return varValue;
    };

    internal.handleDefineFunction = function (scope, exprTree) {
        var functionName = exprTree[1];
        var functionArgNames = exprTree[2];
        var functionBody = exprTree[3];
        var functionValue = ["FUNCTION", functionArgNames, functionBody];

        ScopeHandler.set(scope, functionName, functionValue);
        return functionValue;
    };

    internal.handleBody = function (scope, exprTree) {
        var defines = exprTree[1];
        var exprs = exprTree[2];
        internal.evaluateBlock(scope, defines);
        var result = internal.evaluateBlock(scope, exprs);
        return result;
    };

    internal.handleVariable = function (scope, exprTree) {
        var varName = exprTree[1];
        return ScopeHandler.get(scope, varName);
    };

    internal.handleQuote = function (scope, exprTree) {
        // TODO
    };

    internal.handleLambda = function (scope, exprTree) {
        var functionArgNames = exprTree[1];
        var functionExpr = exprTree[2];
        var functionValue = ["CLOSURE", functionArgNames, functionExpr, scope];
        return functionValue;
    };

    internal.handleIf = function (scope, exprTree) {
        var predicate = internal.evaluateExpression(exprTree[1]);
        var value;
        if (predicate === true || predicate !== 0) {
            value = internal.evaluateBlock(exprTree[2]);
        } else {
            value = false;
        }
        return value;
    };

    internal.handleIfElse = function (scope, exprTree) {
        var predicate = internal.evaluateExpression(exprTree[1]);
        var value;
        if (predicate === true || predicate !== 0) {
            value = internal.evaluateBlock(exprTree[2]);
        } else {
            value = internal.evaluateBlock(exprTree[3]);
        }
        return value;
    };

    internal.handleSet = function (scope, exprTree) {
        //TODO
    };

    internal.handleApplicationExpression = function (scope, exprTree) {
        var functionData = internal.evaluateExpression(scope, exprTree[1]);
        var functionArgs = exprTree[2];

        var evaluatedArgs = [];
        var i;
        for (i = 0; i < functionArgs.length; i += 1) {
            evaluatedArgs.push(
                internal.evaluateExpression(scope, functionArgs[i])
            );
        }

        return internal.handleApplication(scope, functionData, evaluatedArgs);
    };

    internal.handleApplication = function (scope, functionData, evaluatedArgs) {
        var functionType = functionData[0];
        var result;
        switch (functionType) {
            case "FUNCTION":
                result = internal.handleFunction(
                    scope, functionData, evaluatedArgs
                );
                break;
            case "BUILTIN":
                result = internal.handleForeignFunction(
                    scope, functionData, evaluatedArgs
                );
                break;
            case "CLOSURE":
                var closureScope = functionData[3];
                result = internal.handleFunction(
                    closureScope, functionData, evaluatedArgs
                );
                break;
            default:
                Error.create("function type not valid: " + functionType);
        }
        return result;
    };

    internal.handleFunction = function(scope, functionData, functionArgs) {
        var functionArgNames = functionData[1];
        var functionBody     = functionData[2];

        if (functionArgs.length < functionArgNames.length) {
            Error.create("Not enough arguments for function");
        }

        var childScope = ScopeHandler.createChildScope(scope);
        var i;
        for (i = 0; i < functionArgNames.length; i += 1) {
            ScopeHandler.set(childScope, functionArgNames[i], functionArgs[i]);
        }

        return internal.evaluateExpression(childScope, functionBody);
    };

    internal.handleForeignFunction = function(scope, functionData, functionArgs) {
        var foreignFunction = functionData[1];
        var childScope = ScopeHandler.createChildScope(scope);
        // function args have already been evaluated
        return foreignFunction.apply(childScope, functionArgs);
    };

    internal.handleList = function (scope, exprTree) {
        var i, r, exprList = exprTree[1], results = [];
        for (i = 0; i < exprTree.length; i += 1) {
            r = internal.evaluateExpression(scope, exprList[i]);
            results.push(r);
        }
        return results;
    };

    internal.handleVector = function (scope, exprTree) {
        var i, r, expr, exprVector = exprTree[1], results = [];
        for (i = 0; i < exprVector.length; i += 1) {
            r = internal.evaluateExpression(scope, exprVector[i]);
            results.push(r);
        }
        return results;
    };

    return Interpreter;
};

module.exports = {
    create: createInterpreter
};

