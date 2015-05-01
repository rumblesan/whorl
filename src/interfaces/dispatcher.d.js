

declare class Dispatcher {
    register(eventName: string, callback: function):void;
    dispatch(eventName: string, ...args: Array<any>):void;
    unregister(eventName: string, callback: function):void;
}

declare module Dispatch {
    declare function create(): Dispatcher
}

