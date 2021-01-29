const shrubs = require('../entwinedShrubs');

const OFFER_EXPIRATION_PERIOD_SECS = 5.0;
const ACTIVE_SESSION_EXPIRATION_PERIOD_SECS = 15.0;

// TODO: move this to a utility class?
function findSocketBySessionID(sessionId) {
    let io = require('./socketAPI').io;

    for (var [socketId, socket] of io.sockets.sockets) {
        if (socket.request.session.id === sessionId) {
            return socket;
        }
    }

    return null;
}

function getShrubByID(id) {
    id = String(id);
    return shrubs.find(function(shrub) {
        return String(shrub.id) === id;
    });
}

function generateNewSessionExpiryDate() {
    return new Date(Date.now() + (ACTIVE_SESSION_EXPIRATION_PERIOD_SECS * 1000));
}

// TODO: should this really be a class, not just a weird bunch of methods added to each shrub?
shrubs.forEach(function(shrub) {
    // if the ID is an int or anything else, convert to a string so it's easier to work with
    // and match
    shrub.id = String(shrub.id);
    shrub.waitingSessions = [];

    shrub.checkExpiryDates = function() {
        if (shrub.activeSession && shrub.activeSession.expiryDate.getTime() <= Date.now()) {
            let socket = findSocketBySessionID(shrub.activeSession.id);
            if (socket) {
                socket.emit('sessionDeactivated', shrub.id);
            } else {
                // TODO: if we can't find a socket for that session, we should probably offer it to the next in line (and so forth?)
                console.log(`Can't find socket for ${shrub.activeSession.id} to send deactivation notice.`);
            }

            delete shrub.activeSession;

            // give it to the next in line!
            shrub.offerNextSession();
        } // else if (shrub.offeredSession && shrub.offeredSession.expiryDate.getTime() <= Date.now()) {
    };

    shrub.requestActivateSession = function(socket) {
        let sessionId = socket.request.session.id;

        // if there's nobody currently controlling and nobody offered, just activate the session for them immediately
        // or if they're actually _already_ the active session
        if ((!shrub.activeSession && !shrub.offeredSession) || (shrub.activeSession && shrub.activeSession.id === sessionId)) {
            delete shrub.offeredSession;
            // only regenerate the expiry date if they're not already active
            if (!shrub.activeSession) {
                shrub.activeSession = { id: sessionId, expiryDate: generateNewSessionExpiryDate() };
            }
            socket.emit('sessionActivated', { shrubId: shrub.id, expiryDate: shrub.activeSession.expiryDate });
            return;
        }

        // no duplicates in the queue!
        if (!shrub.waitingSessions.includes(sessionId)) {
            shrub.waitingSessions.push(sessionId);
        }

        // TODO: use a proper wait time estimate here
        socket.emit('sessionWaiting', { shrubId: shrub.id, estimatedWaitTime: shrub.waitingSessions.length * 60 })
    };

    shrub.deactivateSession = function(socket) {
        let sessionId = socket.request.session.id;

        // ya can't deactivate a session that's not activated
        if (!shurb.activeSession || shrub.activeSession.id !== sessionId) {
            console.log(`Shrub ${shrub.id} can't deactivate session because it isn't currently active.`);
            return;
        }

        delete shrub.activeSession;

        socket.emit('sessionDeactivated', shrub.id);

        // give it to the next in line!
        shrub.offerNextSession();
    };

    shrub.offerNextSession = function() {
        let nextSessionUp = shrub.waitingSessions[0];

        // if the queue's empty, we're done! nobody else is waiting.
        if (!nextSessionUp) {
            return;
        }

        shrub.offeredSession = nextSessionUp;

        let socket = findSocketBySessionID(nextSessionUp);
        if (!socket) {
            // TODO: if we can't find a socket for that session, we should probably offer it to the next in line (and so forth?)
            console.log(`Can't find socket for ${nextSessionUp} to offer the next active session.`);
            return;
        }
        socket.emit('sessionOffered', {
            shrubId: shrub.id,
            offerExpiryDate: new Date(Date.now() + (OFFER_EXPIRATION_PERIOD_SECS * 1000)),
        });
    };

    shrub.declineOfferedSession = function(socket) {
        let sessionId = socket.request.session.id;

        // ya can't decline a session that's never been offered
        if (shrub.offeredSession !== sessionId) {
            console.log(`Shrub ${shrub.id} can't decline offered session because session ${sessionId} hasn't been offered.`);
            return;
        }

        socket.emit('sessionOfferRevoked', shrub.id);

        // remove the session from waiting since they don't want control (and from offered)
        let sessionIndex = shrub.waitingSessions.findIndex(function(session) {
            return sessionId === session.id;
        });
        shrub.waitingSessions.splice(sessionIndex, 1);
        delete shrub.offeredSession;

        // give it to the next in line!
        shrub.offerNextSession();
    };

    shrub.acceptOfferedSession = function(socket) {
        let sessionId = socket.request.session.id;

        if (shrub.offeredSession !== sessionId) {
            console.log(`Shrub ${shrub.id} did not offer session to ${sessionId}. Ignoring.`);
            return;
        }

        // remove the session from waiting since it's becoming active (and from offered)
        let sessionIndex = shrub.waitingSessions.findIndex(function(session) {
            return sessionId === session.id;
        });
        shrub.waitingSessions.splice(sessionIndex, 1);
        delete shrub.offeredSession;

        shrub.activeSession = { id: sessionId, expiryDate: generateNewSessionExpiryDate() };
        socket.emit('sessionActivated', { shrubId: shrub.id, expiryDate: shrub.activeSession.expiryDate });
    };

    setInterval(shrub.checkExpiryDates, 1000); // 1 second
});


module.exports = {
    getShrubByID
};