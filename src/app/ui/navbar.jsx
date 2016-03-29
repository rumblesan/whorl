
import React from 'react';
import _ from 'lodash';

export default (props) => {
    return (
        <div id='header'>
            <ul className='navmenu'>

                <li><span>Whorl</span></li>

                <li>
                    <span>Demos</span>
                    <ul className='dropdown'>
                        {_.map(
                            props.demos.names,
                            (n) => <li key={`demo-${n}`} onClick={() => props.actions.loadDemo(n)} >{n}</li>
                        )}
                    </ul>
                </li>

                <li>
                    <span>Tutorials</span>
                    <ul className='dropdown'>
                        {_.map(
                            props.tutorials.names,
                            (n) => <li key={`tutorial-${n}`} onClick={() => props.actions.loadTutorial(n)}>{n}</li>
                        )}
                    </ul>
                </li>

                <li>
                    <span>Keybindings</span>
                    <ul className='dropdown'>
                        <li onClick={() => props.actions.setKeyBindings('vim')} >Default</li>
                        <li onClick={() => props.actions.setKeyBindings('default')} >Vim</li>
                    </ul>
                </li>

            </ul>
        </div>
    );
};

