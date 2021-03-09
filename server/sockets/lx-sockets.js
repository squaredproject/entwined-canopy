const sculptureState = require('../sculpture-state');
var lXIO;

const initialize = function(io) {
    lxIO = io.of('/lx');

    lxIO.on('connection', (socket) => {
        console.log(`LX CONNECTED! ${lxIO.sockets.size} LX sockets currently open`);

        socket.on('modelUpdated', (newModel) => {
            console.log('LX connection received modelUpdated: ', newModel);

            if (newModel.interactivityEnabled !== undefined) {
                sculptureState.interactivityEnabled = newModel.interactivityEnabled;
                // TODO: it's cleaner if the sculpture-state object does this itself
                // by watching its own properties
                sculptureState.emit('stateUpdated');
            }

            if (newModel.breakTimerInfo !== undefined) {
                sculptureState.breakTimer = newModel.breakTimer;
                // TODO: it's cleaner if the sculpture-state object does this itself
            }
                // by watching its own properties
                sculptureState.emit('stateUpdated');
        });

        socket.on('disconnect', () => {
            console.log(`LX server disconnected! ${lxIO.sockets.size} LX sockets currently open`);
        });
    });

    console.log(`LX Server mock receive: modelUpdated(${JSON.stringify(sculptureState.serialize())})`);
};

const emit = function(eventName, data) {
    console.log(`LX connection sending: ${eventName}(${JSON.stringify(data)})`);

    if (!lxIO) {
        console.log(`Can't send message because LX socket server isn't initialized.`);
        return;
    }
    
    let sockets = lxIO.sockets;
    if (sockets.size < 1) {
        console.log(`Can't send message because no LX server is connected`);
        return;
    }

    // if we have multiple connected clients, send to all of them
    sockets.forEach((socket) => {
        socket.emit(eventName, data);
    });
};

module.exports = {
    initialize,
    emit
};
