
export const create = (dispatcher) => {
    return {
        loadDemo: (name) => console.log(`Loading Demo: ${name}`),
        loadTutorial: (name) => console.log(`Loading Tutorial: ${name}`),
        setKeyBindings: (name) => console.log(`Setting Key Bindings: ${name}`),
    };
};

