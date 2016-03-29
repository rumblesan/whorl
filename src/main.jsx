/*jslint browser: true */

import React from 'react';
import ReactDOM from 'react-dom';
import {Dispatcher} from 'flux';


import Layout from './app/ui/layout';

import * as Whorl from './app/whorl';

import * as Demos     from './generated/demos';
import * as Tutorials from './generated/tutorials';

import * as Actions from './app/ui/actions';

const dispatcher = new Dispatcher();

const actions = Actions.create(dispatcher);

ReactDOM.render(
    <Layout
        demos={Demos}
        tutorials={Tutorials}
        actions={actions}
    />,
    document.getElementById('app')
);

Whorl.create(dispatcher);

