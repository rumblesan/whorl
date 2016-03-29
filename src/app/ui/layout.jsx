
import NavBar from './newnavbar';
import Program from './program';
import Terminal from './newterminal';

import React from 'react';

export default (props) => {
    return (
        <div>
            <NavBar
                demos={props.demos}
                tutorials={props.tutorials}
                actions={props.actions}
            />
            <Program />
            <Terminal />
        </div>
    );
};

