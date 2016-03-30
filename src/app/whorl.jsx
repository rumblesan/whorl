
import NavBar from './ui/navbar';
import Terminal from './ui/terminal';
import Codemirror from 'react-codemirror';

import * as Core        from './core';

import React from 'react';

export default React.createClass({
    getInitialState: function () {
        return {};
    },
    componentWillMount: function () {
        console.log('mounting');
        this.core = Core.create(this.props.audioContext, this.props.dispatcher);
    },
    render: function () {
        console.log(this.props);
        return (
            <div>
                <NavBar
                    demos={this.props.demos}
                    tutorials={this.props.tutorials}
                    actions={this.props.actions}
                />
                <Codemirror value={'Hello, World!'} />
                <Terminal />
            </div>
        );
    }
});

