/* @flow */

var Demos = require('../generated/demos');
var Tutorials = require('../generated/tutorials');
var $ = require('../lib/jquery-2.1.3');

var NavBar = {};

NavBar.createTutorialMenu = function (dispatcher) {

    var tutlist = $('#tutoriallist');
    var name;
    var listel;
    var t;
    for (t = 0; t < Tutorials.names.length; t += 1) {
        name = Tutorials.names[t];
        listel = $(
            '<li><a data-prog="' + name + '">' + name + '</a></li>'
        );
        tutlist.append(listel);
    }
    tutlist.find('a').click(function (e) {
        var programName = $(this).data('prog');
        var programData = Tutorials.data[programName];
        dispatcher.dispatch('load-program', programName, programData);
        dispatcher.dispatch('term-message', 'Loading tutorial: ' + programName);
    });

};

NavBar.createDemoMenu = function (dispatcher) {

    var demolist = $('#demolist');
    var name;
    var listel;
    var d;
    for (d = 0; d < Demos.names.length; d += 1) {
        name = Demos.names[d];
        listel = $(
            '<li><a data-prog="' + name + '">' + name + '</a></li>'
        );
        demolist.append(listel);
    }
    demolist.find('a').click(function (e) {
        var programName = $(this).data('prog');
        var programData = Demos.data[programName];
        dispatcher.dispatch('load-program', programName, programData);
        dispatcher.dispatch('term-message', 'Loading demo: ' + programName);
    });

};

NavBar.create = function (dispatcher) {
    NavBar.createTutorialMenu(dispatcher);
    NavBar.createDemoMenu(dispatcher);
};

module.exports = NavBar;

