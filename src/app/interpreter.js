/*global require */

var createInterpreter = function (ScopeHandler) {

    var Interpreter = {};

    // scope is a dictionary, stored in and passed in by the Core
    Interpreter.interpret = function (scope, ast) {
        Interpreter.evaluate(scope, ast);
    };

    Interpreter.evaluate = function (scope, ast) {
        Interpreter.evaluateBlock(scope, ast);
    };

    Interpreter.evaluateBlock = function (scope, ast) {
        var i, r, expr, results = [];
        for (i = 0; i < ast.length; i += 1) {
            expr = ast[i];
            r = Interpreter.evaluateExpression(scope, expr);
            results.push(r);
        }
        return results;
    };

    Interpreter.evaluateExpression = function (scope, astExpr) {

        var exprType = astExpr[0];
        var output;

        switch(exprType) {
            case "BEGIN":
                output = Interpreter.handleBegin(scope, astExpr);
                break;
            case "DEFINE":
                output = Interpreter.handleDefine(scope, astExpr);
                break;
            case "DEFINEFUNCTION":
                output = Interpreter.handleDefineFunction(scope, astExpr);
                break;
            case "BODY":
                output = Interpreter.handleBody(scope, astExpr);
                break;
            case "VARIABLE":
                output = Interpreter.handleVariable(scope, astExpr);
                break;
            case "QUOTE":
                output = Interpreter.handleQuote(scope, astExpr);
                break;
            case "LAMBDA":
                output = Interpreter.handleLambda(scope, astExpr);
                break;
            case "IF":
                output = Interpreter.handleIf(scope, astExpr);
                break;
            case "IFELSE":
                output = Interpreter.handleIfElse(scope, astExpr);
                break;
            case "SET":
                output = Interpreter.handleSet(scope, astExpr);
                break;
            case "APPLICATION":
                output = Interpreter.handleApplicationExpression(scope, astExpr);
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
                output = Interpreter.handleList(scope, astExpr);
                break;
            case "VECTOR":
                output = Interpreter.handleVector(scope, astExpr);
                break;
            default:
                throw "exprType not valid: " + exprType;
        }
        return output;
    };

    Interpreter.handleBegin = function (scope, exprTree) {
        var defines = exprTree[1];
        return Interpreter.evaluateBlock(scope, defines);
    };

    Interpreter.handleDefine = function (scope, exprTree) {
        var varName = exprTree[1];
        var varValue = Interpreter.evaluateExpression(scope, exprTree[2]);

        ScopeHandler.set(scope, varName, varValue);
        return varValue;
    };

    Interpreter.handleDefineFunction = function (scope, exprTree) {
        var functionName = exprTree[1];
        var functionArgNames = exprTree[2];
        var functionBody = exprTree[3];
        var functionValue = ["ASTFUNCTION", functionArgNames, functionBody];

        ScopeHandler.set(scope, functionName, functionValue);
        return functionValue;
    };

    Interpreter.handleBody = function (scope, exprTree) {
        var defines = exprTree[1];
        var exprs = exprTree[2];
        Interpreter.evaluateBlock(scope, defines);
        var result = Interpreter.evaluateBlock(scope, exprs);
        return result;
    };

    Interpreter.handleVariable = function (scope, exprTree) {
        var varName = exprTree[1];
        return ScopeHandler.get(scope, varName);
    };

    Interpreter.handleQuote = function (scope, exprTree) {
        // TODO
    };

    Interpreter.handleLambda = function (scope, exprTree) {
        var functionArgs = exprTree[1];
        var functionExpr = exprTree[2];
        var functionValue = ["CLOSURE", functionArgs, functionExpr, scope];
        return functionValue;
    };

    Interpreter.handleIf = function (scope, exprTree) {
        var predicate = Interpreter.evaluateExpression(exprTree[1]);
        var value;
        if (predicate === true || predicate !== 0) {
            value = Interpreter.evaluateBlock(exprTree[2]);
        } else {
            value = false;
        }
        return value;
    };

    Interpreter.handleIfElse = function (scope, exprTree) {
        var predicate = Interpreter.evaluateExpression(exprTree[1]);
        var value;
        if (predicate === true || predicate !== 0) {
            value = Interpreter.evaluateBlock(exprTree[2]);
        } else {
            value = Interpreter.evaluateBlock(exprTree[3]);
        }
        return value;
    };

    Interpreter.handleSet = function (scope, exprTree) {
        //TODO
    };

    Interpreter.handleApplicationExpression = function (scope, exprTree) {
        var functionData = Interpreter.evaluateExpression(scope, exprTree[1]);
        var functionArgs = exprTree[2];

        var evaluatedArgs = [];
        var i;
        for (i = 0; i < functionArgs.length; i += 1) {
            evaluatedArgs.push(
                Interpreter.evaluateExpression(scope, functionArgs[i])
            );
        }

        return Interpreter.handleApplication(scope, functionData, evaluatedArgs);
    };

    Interpreter.handleApplication = function (scope, functionData, evaluatedArgs) {
        var functionType = functionData[0];

        switch (functionType) {
            case "ASTFUNCTION":
                result = Interpreter.handleAstFunction(
                    scope, functionData, evaluatedArgs
                );
                break;
            case "FOREIGNFUNCTION":
                result = Interpreter.handleForeignFunction(
                    scope, functionData, evaluatedArgs
                );
                break;
            case "CLOSURE":
                var closureScope = functionData[3];
                result = Interpreter.handleAstFunction(
                    closureScope, functionData, evaluatedArgs
                );
                break;
            default:
                throw "function type not valid: " + functionType;
        }
        return result;
    };

    Interpreter.handleAstFunction = function(scope, functionData, functionArgs) {
        var functionArgNames = functionData[1];
        var functionBody     = functionData[2];

        if (functionArgs.length < functionArgNames.length) {
            throw "Not enough arguments for function";
        }

        var childScope = ScopeHandler.createChildScope(scope);
        var i;
        for (i = 0; i < functionArgNames.length; i += 1) {
            ScopeHandler.set(childScope, functionArgNames[i], functionArgs[i]);
        }

        return Interpreter.evaluateExpression(childScope, functionBody);
    };

    Interpreter.handleForeignFunction = function(scope, functionData, functionArgs) {
        var foreignFunction = functionData[1];
        var childScope = ScopeHandler.createChildScope(scope);
        // function args have already been evaluated
        return foreignFunction.apply(childScope, functionArgs);
    };

    Interpreter.handleList = function (scope, exprTree) {
        var i, r, exprList = exprTree[1], results = [];
        for (i = 0; i < exprTree.length; i += 1) {
            r = Interpreter.evaluateExpression(scope, exprList[i]);
            results.push(r);
        }
        return results;
    };

    Interpreter.handleVector = function (scope, exprTree) {
        var i, r, expr, exprVector = exprTree[1], results = [];
        for (i = 0; i < exprVector.length; i += 1) {
            r = Interpreter.evaluateExpression(scope, exprVector[i]);
            results.push(r);
        }
        return results;
    };

    return Interpreter;
};

module.exports = {
    create: createInterpreter
};

