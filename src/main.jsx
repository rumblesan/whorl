/*jslint browser: true */

import React from 'react';
import ReactDOM from 'react-dom';

import Layout from './app/ui/layout';

import * as Whorl from './app/whorl';

import * as Demos     from './generated/demos';
import * as Tutorials from './generated/tutorials';

import * as Actions from './app/ui/actions';

const actions = Actions.create(null);

ReactDOM.render(
    <Layout
        demos={Demos}
        tutorials={Tutorials}
        actions={actions}
    />,
    document.getElementById('app')
);

Whorl.create();

