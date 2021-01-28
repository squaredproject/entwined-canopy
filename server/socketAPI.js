const io = require('socket.io')();
const socketAPI = {
  io,
};
const config = require('../config');

const validShrubIDs = require('../entwinedShrubs').map(function(shrubConfig) { return String(shrubConfig.id); });
let getShrubByID = require('./shrub-sessions').getShrubByID;

function shrubIdIsValid(shrubId) {
  return validShrubIDs.includes(shrubId);
};

// TODO: Socket.IO namespaces would be a cleaner way to do this, but
// had trouble getting them working on the client-side with our Vue/Socket lib
io.on('connection', (socket) => {
  console.log('A user connected');

  // lifecycle methods

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  // shrub session management
  socket.on('activateSession', (shrubId) => {
    let shrub = getShrubByID(shrubId);

    if (!shrub) {
      console.log(`Can't activate session for unknown shrub ${shrubId}.`);
      return;
    }

    console.log(`Activating session ${socket.request.session.id} for shrub ${shrubId}.`);

    shrub.requestActivateSession(socket);
  });

  socket.on('deactivateSession', (shrubId) => {
    let shrub = getShrubByID(shrubId);

    if (!shrub) {
      console.log(`Can't activate session for unknown shrub ${shrubId}.`);
      return;
    }

    console.log(`Deactivating session ${socket.request.session.id} for shrub ${shrubId}.`);

    shrub.deactivateSession(socket);
  });

  socket.on('acceptOfferedSession', (shrubId) => {
    let shrub = getShrubByID(shrubId);

    if (!shrub) {
      console.log(`Can't accept offered session for unknown shrub ${shrubId}.`);
      return;
    }

    console.log(`Accepting offered session ${socket.request.session.id} for shrub ${shrubId}.`);

    shrub.acceptOfferedSession(socket);
  });

  socket.on('declineOfferedSession', (shrubId) => {
    let shrub = getShrubByID(shrubId);

    if (!shrub) {
      console.log(`Can't decline offered session for unknown shrub ${shrubId}.`);
      return;
    }

    console.log(`Declining offered session ${socket.request.session.id} for shrub ${shrubId}.`);

    shrub.declineOfferedSession(socket);
  });

  // shrub interactivity controls

  // TODO: make sure only the active session can call these methods (i.e. the sessions in the waiting queue can't take control)

  socket.on('updateShrubSetting', (updateObj) => {
    if (!shrubIdIsValid(updateObj.shrubId)) {
      console.log('Invalid shrub ID ' + updateObj.shrubId);
      return;
    }
    console.log(`Updating shrub ${updateObj.shrubId} setting ${updateObj.key} to value ${updateObj.value}`);
  });

  socket.on('runOneShotTriggerable', (updateObj) => {
    if (!shrubIdIsValid(updateObj.shrubId)) {
      console.log('Invalid shrub ID ' + updateObj.shrubId);
      return;
    }
    console.log(`Running one shot triggerable ${updateObj.triggerableName} on shrub ${updateObj.shrubId}`)
  });
});

module.exports = socketAPI;
