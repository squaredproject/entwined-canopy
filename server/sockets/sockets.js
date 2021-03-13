const config = require('../config/config');
const io = require('socket.io')(null, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? config.staticSiteURLProd : config.staticSiteURLDev,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 10000, // 10 seconds between ping packets
  pingTimeout: 5000 // 5 seconds without a pong packet = disconnected
});
const socketAPI = {
  io,
};

require('./user-sockets').initialize(io);
require('./lx-sockets').initialize(io);

module.exports = socketAPI;
