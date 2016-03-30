
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
                    <p>
                    {
                        _.map(
                            props.terminal.lines,
                            (line) => {
                                if (line.type === 'info') {
                                    return <div><msg>>> </msg>{l.text}<br /></div>
                                } else if (line.type === 'error') {
                                    return <div><err>>> </err>{l.text}<br /></div>
                                } else {
                                    return <div><msg>>> </msg>{l.text}<br /></div>
                                }
                            }
                        )
                    }
                    </p>
                </div>

            </div>
        </div>
    );
};


