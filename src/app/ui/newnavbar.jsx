
import React from 'react';

export default (props) => {
    return (
        <div id='header'>
            <div id='menu'>

                <span className='menu-item'>Whorl</span>

                <span className='menu-item' data-jq-dropdown="#jq-dropdown-1">
                    Demos
                </span>
                <div id="jq-dropdown-1" className="jq-dropdown jq-dropdown-tip">
                    <ul id="demolist" className="jq-dropdown-menu">
                    </ul>
                </div>

                <span  className='menu-item' data-jq-dropdown="#jq-dropdown-2">
                    Tutorials
                </span>
                <div id="jq-dropdown-2" className="jq-dropdown jq-dropdown-tip">
                    <ul id="tutoriallist" className="jq-dropdown-menu">
                    </ul>
                </div>

                <span  className='menu-item' data-jq-dropdown="#jq-dropdown-3">
                    Key Bindings
                </span>
                <div id="jq-dropdown-3" className="jq-dropdown jq-dropdown-tip">
                    <ul id="keybindings" className="jq-dropdown-menu">
                    </ul>
                </div>

            </div>
        </div>
    );
};

