
import * as Demos     from '../../generated/demos';
import * as Tutorials from '../../generated/tutorials';
const $ = require('../../lib/jquery-2.1.3');

const createBindingsMenu = function (dispatcher) {

    const keylist = $('#keybindings');
    keylist.append('<li><a data-binding="default">Default</a></li>');
    keylist.append('<li><a data-binding="vim">Vim</a></li>');

    keylist.find('a').click(function () {
        const bindingName = $(this).data('binding');
        dispatcher.dispatch('set-key-binding', bindingName);
        dispatcher.dispatch('term-message', `Setting keybindings: ${bindingName}`);
    });

};

const createTutorialMenu = function (dispatcher) {

    const tutlist = $('#tutoriallist');

    Tutorials.names.map((name) => {
        const listel = $(
            `<li><a data-prog="${name}">${name}</a></li>`
        );
        tutlist.append(listel);
    });

    tutlist.find('a').click(function () {
        const programName = $(this).data('prog');
        const programData = Tutorials.data[programName];
        dispatcher.dispatch('load-program', programName, programData);
        dispatcher.dispatch('term-message', `Loading tutorial: ${programName}`);
    });

};

const createDemoMenu = function (dispatcher) {

    const demolist = $('#demolist');

    Demos.names.map((name) => {
        const listel = $(
            `<li><a data-prog="${name}">${name}</a></li>`
        );
        demolist.append(listel);
    });
    demolist.find('a').click(function () {
        const programName = $(this).data('prog');
        const programData = Demos.data[programName];
        dispatcher.dispatch('load-program', programName, programData);
        dispatcher.dispatch('term-message', `Loading demo: ${programName}`);
    });

};

export const create = function (dispatcher) {
    createTutorialMenu(dispatcher);
    createDemoMenu(dispatcher);
    createBindingsMenu(dispatcher);
};

