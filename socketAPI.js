const io = require('socket.io')();
const socketAPI = {
  io,
};
const config = require('./config');

const validShrubIDs = require('./entwinedShrubs').map(function(shrubConfig) { return String(shrubConfig.id); });
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

    shrub.requestActivateSession(socket);
  });

  // shrub interactivity controls

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
