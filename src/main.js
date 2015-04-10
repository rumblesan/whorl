/*jslint browser: true */
/*global require */

var domready = require('./lib/ready');
var App = require('./app/app');

domready(function () {

    var app = App.create(document.getElementById('program'));

    app.run();

});

