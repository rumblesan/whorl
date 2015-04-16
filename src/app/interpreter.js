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
                output = Interpreter.handleApplication(scope, astExpr);
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
                throw "exprType not valid";
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
        // body gets evaluated when the function does
        return exprTree;
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
        var functionValue = ["ASTFUNCTION", functionArgs, functionExpr];
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

    Interpreter.handleApplication = function (scope, exprTree) {
        var func = Interpreter.evaluateExpression(scope, exprTree[1]);
        var funcType = func[0];
        var funcArgs = exprTree[2];
        var result;
        switch (funcType) {
            case "ASTFUNCTION":
                result = Interpreter.handleAstFunction(scope, func, funcArgs);
                break;
            case "FOREIGNFUNCTION":
                result = Interpreter.handleForeignFunction(scope, func, funcArgs);
                break;
            default:
                throw "function type not valid";
        }
        return result;
    };

    Interpreter.handleAstFunction = function(scope, func, functionArgs) {
        var functionArgNames = func[1];
        var functionBody     = func[2];

        if (functionArgs.length < functionArgNames.length) {
            throw "Not enough arguments for function";
        }

        var childScope = ScopeHandler.createChildScope(scope);

        var i, argValue;
        for (i = 0; i < functionArgNames.length; i += 1) {
            argValue = Interpreter.evaluateExpression(scope, functionArgs[i]);
            ScopeHandler.set(childScope, functionArgNames[i], argValue);
        }

        var result = Interpreter.evaluateBlock(childScope, functionBody);

    };

    Interpreter.handleForeignFunction = function(scope, func, functionArgs) {
        var foreignFunction = func[1];

        var i, argValue, interpretedArgs = [];
        for (i = 0; i < functionArgs.length; i += 1) {
            argValue = Interpreter.evaluateExpression(scope, functionArgs[i]);
            interpretedArgs.push(argValue);
        }

        var childScope = ScopeHandler.createChildScope(scope);
        var result = foreignFunction.apply(childScope, interpretedArgs);

        return result;
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

