
import NavBar from './navbar';
import Terminal from './terminal';

import React from 'react';

export default (props) => {
    return (
        <div>
            <NavBar
                demos={props.demos}
                tutorials={props.tutorials}
                actions={props.actions}
            />
            <div id='program'></div>
            <Terminal />
        </div>
    );
};

