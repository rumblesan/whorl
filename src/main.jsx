/*jslint browser: true */

import React from 'react';
import ReactDOM from 'react-dom';
import {Dispatcher} from 'flux';


import Whorl from './app/whorl';

import * as AudioSystem from './app/audio';

import * as Demos     from './generated/demos';
import * as Tutorials from './generated/tutorials';

import * as Actions from './app/ui/actions';

const dispatcher = new Dispatcher();

const actions = Actions.create(dispatcher);

var audioContext = null;

try {
    audioContext = AudioSystem.createContext(window);
    console.log(audioContext);
} catch (e) {
    console.log(e);
}

if (audioContext !== null) {
    console.log('Rendering');
    ReactDOM.render(
        <Whorl
            demos={Demos}
            tutorials={Tutorials}
            actions={actions}
            audioContext={audioContext}
            dispatcher={dispatcher}
        />,
        document.getElementById('app')
    );
}
