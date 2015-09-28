
module.exports = {

    add: (audio, dispatcher, ScopeHandler, scope) => {
        ScopeHandler.addFF(scope, '&&', (a, b) => { return (a && b); });
        ScopeHandler.addFF(scope, '||', (a, b) => { return (a || b); });
        ScopeHandler.addFF(scope, '!',  (a)    => { return (! a); });
    }

};

