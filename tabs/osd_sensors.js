'use strict';

const path = require('path');
const tabs = require('./../js/tabs');
const { GUI, TABS } = require('./../js/gui');
const $ = require('jquery');

TABS.osd_sensors = {};

function runTabInto(targetSelector, tabKey, done) {
    const $target = $(targetSelector).empty().addClass('loading');
    const originalLoad = GUI.load;

    GUI.load = function (rel, cb) {
        $.get(rel, function (data) {
            $target.append(data);
            if (cb) cb();
        });
    };

    require('./' + tabKey);
    const initializer = TABS[tabKey] && TABS[tabKey].initialize;

    if (typeof initializer !== 'function') {
        console.error(`Initializer for ${tabKey} not found`);
        GUI.load = originalLoad;
        $target.removeClass('loading');
        GUI.active_tab = 'osd_sensors';
        if (done) done();
        return;
    }

    initializer(function () {
        GUI.load = originalLoad;
        $target.removeClass('loading');
        GUI.active_tab = 'osd_sensors';
        if (done) done();
    });
}

TABS.osd_sensors.initialize = function (callback) {
    GUI.active_tab = 'osd_sensors';

    GUI.load(path.join(__dirname, 'osd_sensors.html'), function () {
        const $container = $('.tab-osd-sensors');
        tabs.init($container);

        let osdLoaded = false;
        let sensorsLoaded = false;

        const setActiveHeader = (id) => {
            $container.find('.subtab__header_label').removeClass('subtab__header_label--current');
            $container.find(`[for="${id}"]`).addClass('subtab__header_label--current');
            $container.find('.subtab__content').removeClass('subtab__content--current');
            $container.find(`#${id}`).addClass('subtab__content--current');
        };

        const loadOsd = () => {
            setActiveHeader('subtab-osd');
            if (!osdLoaded) {
                runTabInto('#subtab-osd', 'osd', null);
                osdLoaded = true;
            }
        };

        const loadSensors = () => {
            setActiveHeader('subtab-sensors');
            if (!sensorsLoaded) {
                runTabInto('#subtab-sensors', 'sensors', null);
                sensorsLoaded = true;
            }
        };

        loadOsd();

        $container.find('[for="subtab-osd"]').on('click', loadOsd);
        $container.find('[for="subtab-sensors"]').on('click', loadSensors);

        callback();
    });
};

TABS.osd_sensors.cleanup = function (callback) {
    const done = callback || function () {};

    const steps = [];
    if (TABS.osd && typeof TABS.osd.cleanup === 'function') {
        steps.push(TABS.osd.cleanup);
    }
    if (TABS.sensors && typeof TABS.sensors.cleanup === 'function') {
        steps.push(TABS.sensors.cleanup);
    }

    let idx = 0;
    const next = function () {
        if (idx < steps.length) {
            steps[idx++](next);
        } else {
            done();
        }
    };

    next();
};
