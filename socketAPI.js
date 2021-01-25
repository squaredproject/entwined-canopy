const io = require('socket.io')({ wsEngine: 'ws' });
const socketAPI = {
  io,
};
const config = require('./config');

function shrubIdIsValid(shrubId) {
  if (typeof shrubId != 'number') {
    shrubId = parseInt(shrubId, 10);
  }

  if (isNaN(shrubId)) {
    return false;
  } else if (shrubId < 0 || shrubId > config.numShrubs - 1) {
    return false;
  } else if (shrubId.toString() != shrubId) {
    console.log(`Shrub ID ${shrubId} is not properly formatted.`);
    return false;
  }

  return true;
};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

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
