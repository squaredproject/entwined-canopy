const sculptureState = require('../sculpture-state');

const initialize = function(io) {
    const lxIO = io.of('/lx');

    lxIO.on('connection', (socket) => {
        console.log('LX CONNECTED!');

        socket.on('modelUpdated', (newModel) => {
            console.log('LX model updated to ', newModel);

            if (newModel.interactivityEnabled !== undefined) {
                sculptureState.interactivityEnabled = newModel.interactivityEnabled;
                // TODO: it's cleaner if the sculpture-state object does this itself
                // by watching its own properties
                sculptureState.emit('stateUpdated');
            }

            if (newModel.breakTimerInfo !== undefined) {
                sculptureState.breakTimer = newModel.breakTimer;
                // TODO: it's cleaner if the sculpture-state object does this itself
                // by watching its own properties
                sculptureState.emit('stateUpdated');
            }
        });
    });

    console.log(`LX Server mock receive: stateUpdated(${JSON.stringify(sculptureState.serialize())})`);
};

module.exports = initialize;
