/*jslint browser: true */

var $ = require('./lib/jquery-2.1.3');
// necessary so that jquery plugins work
window.jQuery = $;
require('./lib/jquery.dropdown');

import * as Whorl from './app/whorl';

$(Whorl.create);

