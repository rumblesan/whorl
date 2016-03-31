
import React from 'react';

import _ from 'lodash';

export default (props) => {
    return (
        <div id='console'>
            <div id="terminal-window">

                <div id="terminal-toolbar">
                    <div id="terminal-top">

                        <div id="terminal-menu"></div>

                    </div>
                </div>

                <div id="terminal-body">
                    {
                        _.map(
                            props.terminal.lines,
                            (line, idx) => {
                                if (line.type === 'info') {
                                    return <p key={idx}><msg>>> </msg>{line.text}<br /></p>
                                } else if (line.type === 'error') {
                                    return <p key={idx}><err>>> </err>{line.text}<br /></p>
                                } else {
                                    return <p key={idx}><msg>>> </msg>{line.text}<br /></p>
                                }
                            }
                        )
                    }
                </div>

            </div>
        </div>
    );
};


