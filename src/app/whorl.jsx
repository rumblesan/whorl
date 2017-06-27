
// Libs
import React from 'react';
import {Dispatcher} from 'flux';

// UI Elements
import NavBar from './ui/navbar';
import Terminal from './ui/terminal';
import Codemirror from 'react-codemirror';

// Stores
import * as TerminalTextStore from './stores/terminal-text';
import * as EditorCodeStore from './stores/editor-code';

import * as Demos     from '../generated/demos';
import * as Tutorials from '../generated/tutorials';

import * as Core        from './core';
import * as AudioSystem from './audio';

import * as Actions from './ui/actions';

const dispatcher = new Dispatcher();

const actions = Actions.create(dispatcher);

const terminalText = TerminalTextStore.create(dispatcher);
const editorCode = EditorCodeStore.create(dispatcher, Demos, Tutorials);

export default React.createClass({
    getInitialState: function () {
        return {
            systems: {
                audio: 'STOPPED'
            },
            terminal: terminalText.getState(),
            code: editorCode.getState()
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
        var self = this;
        terminalText.addChangeListener(() => {
            self.setState({terminal: terminalText.getState()});
        });
        editorCode.addChangeListener(() => {
            self.setState({code: editorCode.getCode()});
        });
    },
    render: function () {
        return (
            <div>
                <NavBar
                    demos={Demos}
                    tutorials={Tutorials}
                    actions={actions}
                />
                <Codemirror value={this.state.code} />
                <Terminal terminal={this.state.terminal}/>
            </div>
        );
    }
});

