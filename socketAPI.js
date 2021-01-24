const io = require('socket.io')();

const socketAPI = {
  io,
};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('updateShrubSetting', (updateObj) => {
    console.log(`Updating shrub setting ${updateObj.key} to value ${updateObj.value}`);
  });

  socket.on('runOneShotTriggerable', (triggerableName) => {
    console.log(`Running one shot triggerable ${triggerableName}`)
  });
});

module.exports = socketAPI;
