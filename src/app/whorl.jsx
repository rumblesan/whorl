
// Libs
import React from 'react';
import {Dispatcher} from 'flux';

// UI Elements
import NavBar from './ui/navbar';
import Terminal from './ui/terminal';
import Codemirror from 'react-codemirror';

// Stores
import * as TerminalTextStore from './stores/terminal-text';

import * as Core        from './core';
import * as AudioSystem from './audio';

import * as Demos     from '../generated/demos';
import * as Tutorials from '../generated/tutorials';

import * as Actions from './ui/actions';


const dispatcher = new Dispatcher();

const actions = Actions.create(dispatcher);

const terminalText = TerminalTextStore.create(dispatcher);

export default React.createClass({
    getInitialState: function () {
        return {
            systems: {
                audio: 'STOPPED'
            },
            terminal: terminalText.getState()
        };
    },
    componentWillMount: function () {
        try {
            this.audioContext = AudioSystem.createContext(window);
            this.setState({systems: {audio: 'STARTED'}});
        } catch (e) {
            console.log(e);
            this.setState({systems: {audio: 'ERROR'}});
        }
        this.core = Core.create(this.audioContext, dispatcher);
    },
    componentDidMount: function () {
        terminalText.addChangeListener(this._onChange);
    },
    render: function () {
        return (
            <div>
                <NavBar
                    demos={Demos}
                    tutorials={Tutorials}
                    actions={actions}
                />
                <Codemirror value={'Hello, World!'} />
                <Terminal terminal={this.state.terminal}/>
            </div>
        );
    },
    _onChange: function () {
        this.setState({
            systems: this.state.systems,
            terminal: terminalText.getState()
        });
    }
});

