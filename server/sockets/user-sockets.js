const _ = require('underscore');
const sculptureState = require('../sculpture-state');

const validShrubIDs = require('../config/entwinedShrubs').map(function(shrubConfig) { return String(shrubConfig.id); });
let getShrubByID = require('../Shrub').getShrubByID;
function shrubIdIsValid(shrubId) {
  return validShrubIDs.includes(shrubId);
};
let lxSockets = require('./lx-sockets');

const initialize = function(io) {
    const userIO = io.of('/user');

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
        socket.emit('sculptureStateUpdated', sculptureState.serialize());

        // lifecycle methods

        socket.on('disconnect', () => {
            console.log(`Session ${socket.sessionId} disconnected`);
        });

        // shrub session management
        socket.on('activateSession', (shrubId) => {
            let shrub = getShrubByID(shrubId);

            if (!shrub) {
                console.log(`Can't activate session for unknown shrub ${shrubId}.`);
                return;
            }

            console.log(`Activating session ${socket.sessionId} for shrub ${shrubId}.`);

            shrub.requestActivateSession(socket);
        });

        socket.on('deactivateSession', (shrubId) => {
            let shrub = getShrubByID(shrubId);

            if (!shrub) {
                console.log(`Can't activate session for unknown shrub ${shrubId}.`);
                return;
            }

            console.log(`Deactivating session ${socket.sessionId} for shrub ${shrubId}.`);

            shrub.deactivateSession(socket);
        });

        socket.on('acceptOfferedSession', (shrubId) => {
            let shrub = getShrubByID(shrubId);

            if (!shrub) {
                console.log(`Can't accept offered session for unknown shrub ${shrubId}.`);
                return;
            }

            console.log(`Accepting offered session ${socket.sessionId} for shrub ${shrubId}.`);

            shrub.acceptOfferedSession(socket);
        });

        socket.on('declineOfferedSession', (shrubId) => {
            let shrub = getShrubByID(shrubId);

            if (!shrub) {
                console.log(`Can't decline offered session for unknown shrub ${shrubId}.`);
                return;
            }

            console.log(`Declining offered session ${socket.sessionId} for shrub ${shrubId}.`);

            shrub.declineOfferedSession(socket);
        });

        // shrub interactivity controls

        socket.on('updateShrubSetting', (updateObj) => {
            updateObj = _.pick(updateObj, ['shrubId', 'hue', 'hueSet', 'saturation', 'brightness', 'colorCloud']);

            let shrub = getShrubByID(updateObj.shrubId);
            if (!shrub) {
                console.log('Invalid shrub ID ' + updateObj.shrubId);
                return;
            }
            if (!shrub.activeSession || shrub.activeSession.id !== socket.sessionId) {
                console.log(`Session ${socket.sessionId} isn't active and can't perform updates.`);
                return;
            }

            // TODO enforce min/max values for each setting

            console.log(`Updating shrub ${updateObj.shrubId} settings: ${JSON.stringify(_.omit(updateObj, 'shrubId'))}`);
            lxSockets.emit('updateShrubSetting', updateObj);
        });

        socket.on('runOneShotTriggerable', (updateObj) => {
            let shrub = getShrubByID(updateObj.shrubId);
            if (!shrub) {
                console.log('Invalid shrub ID ' + updateObj.shrubId);
                return;
            }
            if (!shrub.activeSession || shrub.activeSession.id !== socket.sessionId) {
                console.log(`Session ${socket.sessionId} isn't active and can't run teriggerables.`);
                return;
            }

            console.log(`Running one shot triggerable ${updateObj.triggerableName} on shrub ${updateObj.shrubId}`)
            lxSockets.emit('runOneShotTriggerable', _.pick(updateObj, ['shrubId', 'triggerableName']));
        });
    });

    // keep clients abreast of sculpture state changes
    const notifyUpdatedSculptureState = function() {
        userIO.sockets.forEach((socket) => {
            socket.emit('sculptureStateUpdated', sculptureState.serialize());
        });
    };
    sculptureState.on('stateUpdated', notifyUpdatedSculptureState);    
    notifyUpdatedSculptureState();
};

module.exports = {
    initialize
};
