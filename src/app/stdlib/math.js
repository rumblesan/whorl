
import * as ScopeHandler from '../language/scopeHandler';

export const add = (audio, dispatcher, scope) => {
    ScopeHandler.addFF(scope, '+', (a, b) => { return a + b; });
    ScopeHandler.addFF(scope, '-', (a, b) => { return a - b; });
    ScopeHandler.addFF(scope, '*', (a, b) => { return a * b; });
    ScopeHandler.addFF(scope, '/', (a, b) => { return a / b; });
    ScopeHandler.addFF(scope, '^', (a, b) => { return a ^ b; });
    ScopeHandler.addFF(scope, '%', (a, b) => { return a % b; });
};

