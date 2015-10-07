
import * as Error        from '../error';

export const checkFunctionTypes = (func, inputArgs) => {
    let i;
    for (i = 0; i < func.argTypes.length; i += 1) {
        if (!checkType(func.argTypes[i], inputArgs[i])) {
            return false;
        }
    }
    return true;
};

// Check if two type expressions are the same
export const checkType = (type, value) => {
    if (type.name === 'GENERIC') {
        return true;
    }
    if (type.name === value.node) {
        return true;
    }
    if (type.name === 'LIST') {
        throw Error.create(
            Error.types.type,
            `Can't properly check list types`
        );
    }
    if (type.name === 'MAP') {
        throw Error.create(
            Error.types.type,
            `Can't properly check map types`
        );
    }
    return false;
};

