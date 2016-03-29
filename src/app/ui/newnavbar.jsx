
import React from 'react';

export default (props) => {
    return (
        <div id='header'>
            <ul className='navmenu'>

                <li><span>Whorl</span></li>

                <li>
                    <span>Demos</span>
                    <ul className='dropdown'>
                        <li>Demo 1</li>
                        <li>Demo 2</li>
                    </ul>
                </li>

                <li>
                    <span>Tutorials</span>
                    <ul className='dropdown'>
                        <li>Tutorial 1</li>
                        <li>Tutorial 2</li>
                    </ul>
                </li>

                <li>
                    <span>Keybindings</span>
                    <ul className='dropdown'>
                        <li>Vim</li>
                        <li>Normal</li>
                    </ul>
                </li>

            </ul>
        </div>
    );
};

