let _ = require('underscore');
var EventEmitter = require('events').EventEmitter;

const state = new EventEmitter();

Object.assign(state, {
    interactivityEnabled: true,
    breakTimer: {
        runSeconds: 0,
        pauseSeconds: 0,
        state: 'run',
        nextStateChangeDate: new Date()
    }
});

state.serialize = function() {
    return _.pick(this, ['interactivityEnabled', 'breakTimer']);
};

module.exports = state;
