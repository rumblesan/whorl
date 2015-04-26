/*jslint browser: true */
/*global require */

var $ = require('./lib/jquery-2.1.3');
// necessary so that jquery plugins work
window.jQuery = $;
require('./lib/jquery.dropdown');

var Whorl = require('./app/whorl');

$(Whorl.create);

