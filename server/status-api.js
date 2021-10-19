const express = require('express');
const lxSockets = require('./sockets/lx-sockets');
const config = require('./config/config')

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
            // unfortunately, LX goes down every night between 9:30pm and 6am because that's how we shut off the lights
            // and we don't want StatusCake sending us a million monitoring emails for that
            // so we're going to fib a bit, and say things are working even if LX isn't connected
            // as long as it's between that window (with 2 min on either side for leeway)

            // disabled because no downtime at EDC

            // let curDate = new Date();
            // let downtimeStart = config.nightlyDowntimeStart;
            // let downtimeEnd = config.nightlyDowntimeEnd;

            // let beforeDowntimeStart = (curDate.getHours() < downtimeStart.hours ||
            //                           (curDate.getHours() === downtimeStart.hours && curDate.getMinutes() < (downtimeStart.minutes - 2)));
            // let afterDowntimeEnd = (curDate.getHours() > downtimeEnd.hours ||
            //                        (curDate.getHours() === downtimeEnd.hours && curDate.getMinutes() > (downtimeEnd.minutes + 2)));

            // if (beforeDowntimeStart && afterDowntimeEnd) {
                res.status(503).send('LX is NOT connected');
            // } else {
            //     res.status(203).send('LX is NOT connected, but that is expected given nightly downtime');
            // }
        }
    });

    return app;
};

module.exports = getAPIListener;
