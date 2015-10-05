
export const Generic = (alias) => {
    return {
        type: 'GENERIC',
        alias: alias
    };
};

export const UndefinedType = () => {
    return {
        type: 'UNDEFINED'
    };
};

export const SimpleType = (name) => {
    return {
        type: 'SIMPLETYPE',
        name: name
    };
};

export const FunctionType = (argTypes, returnType) => {
    return {
        type: 'FUNCTIONTYPE',
        argTypes: argTypes,
        returnType: returnType
    };
};

export const ListType = (containedType) => {
    return {
        type: 'LISTTYPE',
        containedType: containedType
    };
};

export const MapType = (keyType, valueType) => {
    return {
        type: 'MAPTYPE',
        keyType: keyType,
        valueType: valueType
    };
};

