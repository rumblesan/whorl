/*jslint browser: true */
/*global require */

var Demos = require('../generated/demos');
var Tutorials = require('../generated/tutorials');
var $ = require('../lib/jquery-2.1.3');

var NavBar = {};

NavBar.createTutorialMenu = function (terminal, editor) {

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
        var progName = $(this).data('prog');
        var prog = Tutorials.data[progName];
        editor.doc.setValue(prog);
        terminal.message('Loading tutorial: ' + progName);
    });

};

NavBar.createDemoMenu = function (terminal, editor) {

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
        var progName = $(this).data('prog');
        var prog = Demos.data[progName];
        console.log(prog);
        editor.doc.setValue(prog);
        terminal.message('Loading demo: ' + progName);
    });

};

NavBar.create = function (terminal, editor) {
    NavBar.createTutorialMenu(terminal, editor);
    NavBar.createDemoMenu(terminal, editor);
};

module.exports = NavBar;

