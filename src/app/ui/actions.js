
export const create = (dispatcher) => {
    return {
        loadDemo: (name) => {
            dispatcher.dispatch({
                type: 'LOAD-DEMO',
                demoName: name
            });
        },
        loadTutorial: (name) => {
            dispatcher.dispatch({
                type: 'LOAD-TUTORIAL',
                tutorialName: name
            });
        },
        setKeyBindings: (name) => {
            dispatcher.dispatch({
                type: 'SET-KEY-BINDINGS',
                keyBindingName: name
            });
        }
    };
};

