const _ = require('underscore');

let getPieceByID = require('../Piece').getPieceByID;

let lxSockets = require('./lx-sockets');
let userIO;

const initialize = function(io) {
    userIO = io.of('/user');

    // make the sessionId property a little easier to find
    userIO.use((socket, next) => {
        socket.sessionId = socket.handshake.auth.sessionId;
        next();
    });

    // TODO: Socket.IO namespaces would be a cleaner way to do this, but
    // had trouble getting them working on the client-side with our Vue/Socket lib
    userIO.on('connection', (socket) => {
        console.log(`Session ${socket.sessionId} connected`);

        // send them the initial sculpture state so they know what's up
        // socket.emit('sculptureStateUpdated', sculptureState.serialize());

        if (lxSockets.anyLXIsConnected()) {
            socket.emit('lxConnected');
        } else {
            socket.emit('lxDisconnected');
        }

        // lifecycle methods

        socket.on('disconnect', () => {
            console.log(`Session ${socket.sessionId} disconnected`);
        });

        // piece session management
        socket.on('activateSession', (installationId, pieceId) => {
            let piece = getPieceByID(installationId, pieceId);

            if (!piece) {
                console.log(`Can't activate session ${socket.sessionId} for unknown piece ${pieceId}.`);
                return;
            }

            // track which pieceId this socket is interacting with
            socket.pieceId = pieceId;
            socket.installationId = installationId;
            piece.recordActionForSession(socket.sessionId);

            console.log(`Activating session ${socket.sessionId} for piece ${pieceId}.`);

            piece.requestActivateSession(socket);
        });

        socket.on('deactivateSession', (installationId, pieceId) => {
            let piece = getPieceByID(installationId, pieceId);

            if (!piece) {
                console.log(`Can't activate session ${socket.sessionId} for unknown piece ${pieceId}.`);
                return;
            }

            // track which pieceId this socket is interacting with
            socket.pieceId = pieceId;
            socket.installationId = installationId;
            piece.recordActionForSession(socket.sessionId);

            console.log(`Deactivating session ${socket.sessionId} for piece ${pieceId}.`);

            piece.deactivateSession(socket);
        });

        socket.on('acceptOfferedSession', (installationId, pieceId) => {
            let piece = getPieceByID(installationId, pieceId);

            if (!piece) {
                console.log(`Can't accept offered session ${socket.sessionId} for unknown piece ${pieceId}.`);
                return;
            }

            // track which pieceId this socket is interacting with
            socket.pieceId = pieceId;
            socket.installationId = installationId;
            piece.recordActionForSession(socket.sessionId);

            console.log(`Accepting offered session ${socket.sessionId} for piece ${pieceId}.`);

            piece.acceptOfferedSession(socket);
        });

        socket.on('declineOfferedSession', (installationId, pieceId) => {
            let piece = getPieceByID(installationId, pieceId);

            if (!piece) {
                console.log(`Can't decline offered session ${socket.sessionId} for unknown piece ${pieceId}.`);
                return;
            }

            // track which pieceId this socket is interacting with
            socket.pieceId = pieceId;
            socket.installationId = installationId;
            piece.recordActionForSession(socket.sessionId);

            console.log(`Declining offered session ${socket.sessionId} for piece ${pieceId}.`);

            piece.declineOfferedSession(socket);
        });

        // piece interactivity controls

        socket.on('updatePieceSetting', (updateObj) => {
            updateObj = _.pick(updateObj, ['installationId', 'pieceId', 'hueSet', 'saturation', 'brightness', 'colorCloud']);

            let piece = getPieceByID(updateObj.installationId, updateObj.pieceId);
            if (!piece) {
                console.log('Invalid piece ID ' + updateObj.pieceId);
                return;
            }
            if (!piece.activeSession || piece.activeSession.id !== socket.sessionId) {
                console.log(`Session ${socket.sessionId} isn't active and can't perform updates.`);
                return;
            }

            // track which pieceId this socket is interacting with
            socket.pieceId = piece.id;
            socket.installationId = piece.installationId;
            piece.recordActionForSession(socket.sessionId);

            // TODO enforce min/max values for each setting

            console.log(`Updating piece ${updateObj.pieceId} settings: ${JSON.stringify(_.omit(updateObj, 'pieceId', 'installationId'))} (session = ${socket.sessionId})`);

            // Scottsdale installation needs this for backwards-compat since it's on an old LX version before this was renamed
            // TODO: remove after Scottsdale installation ends
            if (piece.installationId === 'shrubs') {
                lxSockets.emit('updateShrubSetting', updateObj, piece.installationId, piece.id);
            } else {
                lxSockets.emit('updatePieceSetting', updateObj, piece.installationId, piece.id);
            }
        });

        socket.on('runOneShotTriggerable', (updateObj) => {
            let piece = getPieceByID(updateObj.installationId, updateObj.pieceId);
            if (!piece) {
                console.log('Invalid piece ID ' + updateObj.pieceId);
                return;
            }
            if (!piece.activeSession || piece.activeSession.id !== socket.sessionId) {
                console.log(`Session ${socket.sessionId} isn't active and can't run teriggerables.`);
                return;
            }

            // track which pieceId this socket is interacting with
            socket.pieceId = piece.id;
            socket.installationId = piece.installationId;
            piece.recordActionForSession(socket.sessionId);

            console.log(`Running one shot triggerable ${updateObj.triggerableName} on piece ${updateObj.pieceId} (session = ${socket.sessionId})`)
            lxSockets.emit('runOneShotTriggerable', _.pick(updateObj, ['installationId', 'pieceId', 'triggerableName']), piece.installationId, piece.id);
        });
    });

    // keep clients abreast of sculpture state changes
    // const notifyUpdatedSculptureState = function() {
    //     console.log('Notifying clients of updated sculpture state...');
    //     userIO.sockets.forEach((socket) => {
    //         socket.emit('sculptureStateUpdated', sculptureState.serialize());
    //     });
    // };
    // sculptureState.on('stateUpdated', notifyUpdatedSculptureState);    
    // notifyUpdatedSculptureState();
};

const allSocketsForInstallation = function(installationId) {
    return Array.from(userIO.sockets.values()).filter((socket) => {
        return socket.installationId === installationId;
    });
};

const notifyLXConnected = function(installationId) {
    if (!userIO) {
        return;
    }

    let installationSockets = allSocketsForInstallation(installationId);
    console.log(`Notifying ${installationSockets.length} clients of LX connection...`);
    installationSockets.forEach((socket) => {
        socket.emit('lxConnected');
    });
};
const notifyLXDisconnected = function(installationId) {
    if (!userIO) {
        return;
    }

    let installationSockets = allSocketsForInstallation(installationId);
    console.log(`Notifying ${installationSockets.length} clients of LX disconnection...`);
    installationSockets.forEach((socket) => {
        socket.emit('lxDisconnected');
    });
};

module.exports = {
    initialize,
    notifyLXConnected,
    notifyLXDisconnected
};
