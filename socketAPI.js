const io = require('socket.io')();
const socketAPI = {
    io: io
};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

module.exports = socketAPI;
