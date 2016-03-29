/*jslint browser: true */

import React from 'react';
import ReactDOM from 'react-dom';

import Layout from './app/ui/layout';

import * as Whorl from './app/whorl';

ReactDOM.render(
    <Layout />,
    document.getElementById('app')
);

Whorl.create();

