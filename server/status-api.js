const express = require('express');
const lxSockets = require('./sockets/lx-sockets');
const config = require('./config/config')
const installations = require('../config/entwinedInstallations');

const getAPIListener = function() {
    const app = express();

    app.get('/status/canopy-api', function(req, res) {
        // we are always up, because if we're not up we're down :)
        res.status(200).send('Canopy API server is up and running');
    });

    app.get('/status/:installationId/lx-connection', function(req, res) {
        let installationId = req.params.installationId;
        let installation = installations[installationId];
        let lxIsConnected = lxSockets.lxIsConnected(installationId);

        if (lxIsConnected) {
            res.status(200).send(`LX is connected for installation ${installationId}`);
        } else {
            let inDowntime = false;
            if (installation.nightlyDowntime) {
                // unfortunately, LX goes down every night between 9:30pm and 6am on the GGP installation because that's how we shut off the lights
                // and we don't want StatusCake sending us a million monitoring emails for that
                // so we're going to fib a bit, and say things are working even if LX isn't connected
                // as long as it's between that window (with 2 min on either side for leeway)
                let curDate = new Date();
                let downtimeStart = installation.nightlyDowntime.start;
                let downtimeEnd = installation.nightlyDowntime.end;

                let beforeDowntimeStart = (curDate.getHours() < downtimeStart.hours ||
                                        (curDate.getHours() === downtimeStart.hours && curDate.getMinutes() < (downtimeStart.minutes - 2)));
                let afterDowntimeEnd = (curDate.getHours() > downtimeEnd.hours ||
                                    (curDate.getHours() === downtimeEnd.hours && curDate.getMinutes() > (downtimeEnd.minutes + 2)));

                inDowntime = !(beforeDowntimeStart && afterDowntimeEnd);
            }

            if (!inDowntime) {
                res.status(503).send(`LX is NOT connected for installation ${installationId}`);
            } else {
                res.status(203).send(`LX is NOT connected for installation ${installationId}, but that is expected given nightly downtime`);
            }
        }
    });

    return app;
};

module.exports = getAPIListener;
