const installations = require('../config/entwinedInstallations');
var lXIO;

const initialize = function(io) {
    let userSockets = require('./user-sockets');
    lxIO = io.of('/lx');

    lxIO.on('connection', (socket) => {
        console.log(`LX CONNECTED! Client IP ${socket.request.connection.remoteAddress} (${lxIO.sockets.size} LX sockets currently open)`);

        socket.on('modelUpdated', (newModel) => {
            console.log('LX connection received modelUpdated: ', newModel);

            let installationId = newModel.installationId;

            if (!installationId) {
                // Scottsdale is running an old version of LX that doesn't send the installation ID,
                // so for now we assume anything without an installation ID is Scottsdale (aka shrubs)
                // after Scottsdale closes, this should become an error that kills the connection
                console.log('WARNING: LX connection did not send installation ID in modelUpdated, using default installation ID shrubs');
                installationId = 'shrubs';
            }

            if (!installations[installationId]) {
                console.log('ERROR: LX connection sent invalid installation ID ' + installationId);
                return;
            }

            socket.installationId = installationId;
            userSockets.notifyLXConnected(installationId);

            // for now, we ignore interactivityEnabled and breakTimerInfo, even though they're sent in the model

            // if (newModel.interactivityEnabled !== undefined) {
            //     sculptureState.interactivityEnabled = newModel.interactivityEnabled;
            //     // TODO: it's cleaner if the sculpture-state object does this itself
            //     // by watching its own properties
            //     sculptureState.emit('stateUpdated');
            // }

            // if (newModel.breakTimerInfo !== undefined) {
            //     sculptureState.breakTimer = newModel.breakTimer;
            //     // TODO: it's cleaner if the sculpture-state object does this itself
            //     // by watching its own properties
            //     sculptureState.emit('stateUpdated');
            // }
        });

        socket.on('disconnect', () => {
            console.log(`LX server disconnected for installation ${socket.installationId}! Client IP ${socket.request.connection.remoteAddress} ${lxIO.sockets.size} LX sockets currently open`);
            if(socket.installationId && !lxIsConnected(socket.installationId)) {
                userSockets.notifyLXDisconnected(socket.installationId);
            }
        });
    });
};

const emit = function(eventName, data, installationId, pieceId) {
    data = data || {};
    data.installationId = installationId;
    data.pieceId = pieceId;

    // for backwards-compatibility, remove this after Scottsdale installation shuts down and it's no longer needed
    data.shrubId = pieceId;

    console.log(`LX connection sending: ${eventName}(${JSON.stringify(data)})`);

    let connectedLX = connectedLXForInstallation(installationId);

    if (connectedLX.length < 1) {
        console.log(`Can't send message because no LX server is connected for installation ${installationId}.`);
        return;
    }

    // if we have multiple connected clients for this installation, send to all of them
    connectedLX.forEach((socket) => {
        socket.emit(eventName, data);
    });
};

const connectedLXForInstallation = function(installationId) {
    if (!lxIO) {
        return [];
    }

    return Array.from(lxIO.sockets.values()).filter((socket) => {
        return socket.installationId === installationId;
    });
};

const anyLXIsConnected = function() {
    if (!lxIO) {
        return false;
    }
    
    return (lxIO.sockets.size >= 1);
};

const lxIsConnected = function(installationId) {
    if (!installationId) return anyLXIsConnected();

    if (!lxIO) {
        return false;
    }
    
    return (connectedLXForInstallation(installationId).length >= 1);
};


module.exports = {
    initialize,
    emit,
    anyLXIsConnected,
    lxIsConnected
};
