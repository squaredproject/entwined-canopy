const express = require('express');
const lxSockets = require('./sockets/lx-sockets');

const getAPIListener = function() {
    const app = express();

    app.get('/status/canopy-api', function(req, res) {
        // we are always up, because if we're not up we're down :)
        res.status(200).send('Canopy API server is up and running');
    });

    app.get('/status/lx-connection', function(req, res) {
        let lxIsConnected = lxSockets.lxIsConnected();

        if (lxIsConnected) {
            res.status(200).send('LX is connected');
        } else {
            res.status(503).send('LX is NOT connected');
        }
    });

    return app;
};

module.exports = getAPIListener;
