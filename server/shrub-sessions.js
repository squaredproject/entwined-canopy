const shrubs = require('../entwinedShrubs');

const OFFER_EXPIRATION_PERIOD_SECS = 15.0;
const ACTIVE_SESSION_EXPIRATION_PERIOD_SECS = 60.0;

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
function generateNewOfferExpiryDate() {
    return new Date(Date.now() + (OFFER_EXPIRATION_PERIOD_SECS * 1000));
}

function removeSessionFromWaitingQueue(waitingSessions, sessionId) {
    let sessionIndex = waitingSessions.indexOf(sessionId);
    if (sessionIndex >= 0) {
        waitingSessions.splice(sessionIndex, 1);
    }
}
function moveSessionToBackOfQueue(waitingSessions, sessionId) {
    removeSessionFromWaitingQueue(waitingSessions, sessionId);
    waitingSessions.push(sessionId);
}

function estimateWaitTime(waitingSessions, activeSession, offeredSession, sessionId) {
    let sessionIndex = waitingSessions.indexOf(sessionId);
    if (sessionIndex < 0) return 0;

    // if the session already has an offer, it's always a 0
    if (offeredSession && offeredSession.id === sessionId) return 0;

    let activeWaitTime = activeSession ? Math.max(activeSession.expiryDate.getTime() - Date.now(), 0) : 0;
    let queueWaitTime = (sessionIndex + (offeredSession ? 1 : 0)) * ACTIVE_SESSION_EXPIRATION_PERIOD_SECS * 1000;

    // return the value in seconds
    return (activeWaitTime + queueWaitTime) / 1000;
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
                console.log(`Can't find socket for ${shrub.activeSession.id} to send deactivation notice.`);
            }

            delete shrub.activeSession;

            // give it to the next in line!
            shrub.offerNextSession();
        } else if (shrub.offeredSession && shrub.offeredSession.expiryDate.getTime() <= Date.now()) {
            let socket = findSocketBySessionID(shrub.offeredSession.id);
            if (socket) {
                socket.emit('sessionOfferRevoked', shrub.id);
            } else {
                console.log(`Can't find socket for ${shrub.offeredSession.id} to send offer revocation notice.`);
            }

            // move their session to the back of the queue and keep going
            moveSessionToBackOfQueue(shrub.waitingSessions, shrub.offeredSession.id);
            delete shrub.offeredSession;
    
            // give it to the next in line!
            shrub.offerNextSession();
        }
    };

    shrub.sendUpdatedWaitTimes = function() {
        shrub.waitingSessions.forEach(function(sessionId) {
            // if a session has already been offered, don't send a wait time
            if (shrub.offeredSession && sessionId === shrub.offeredSession.id) return;

            let socket = findSocketBySessionID(sessionId);
            if (socket) {
                let waitTime = estimateWaitTime(shrub.waitingSessions, shrub.activeSession, shrub.offeredSession, sessionId);
                socket.emit('waitTimeUpdated', { shrubId: shrub.id, estimatedWaitTime: waitTime });
            }            
        });
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
            shrub.sendUpdatedWaitTimes();
            return;
        }

        // no duplicates in the queue!
        if (!shrub.waitingSessions.includes(sessionId)) {
            shrub.waitingSessions.push(sessionId);
        }

        let waitTime = estimateWaitTime(shrub.waitingSessions, shrub.activeSession, shrub.offeredSession, sessionId);
        socket.emit('sessionWaiting', { shrubId: shrub.id, estimatedWaitTime: waitTime })
    };

    shrub.deactivateSession = function(socket) {
        let sessionId = socket.request.session.id;

        // ya can't deactivate a session that's not activated
        if (!shrub.activeSession || shrub.activeSession.id !== sessionId) {
            console.log(`Shrub ${shrub.id} can't deactivate session because it isn't currently active.`);
            return;
        }

        delete shrub.activeSession;

        socket.emit('sessionDeactivated', shrub.id);

        // give it to the next in line!
        shrub.offerNextSession();
    };

    shrub.offerNextSession = function() {
        console.log('offer next session!');
        // if the queue's empty, we're done! nobody else is waiting.
        if (!shrub.waitingSessions.length) {
            console.log('no waiting queue found, giving up');
            return;
        }

        // find the next session (assuming)
        var nextSessionUp;
        var socket;
        do {
            nextSessionUp = shrub.waitingSessions[0];
            socket = findSocketBySessionID(nextSessionUp);
            console.log(`Found socket for ${nextSessionUp}? ${!!socket}`);

            if (!socket) {
                console.log(`Can't find socket for ${nextSessionUp} to offer the next active session, removing from waiting queue.`);

                removeSessionFromWaitingQueue(nextSessionUp);
            }
        } while (!socket && shrub.waitingSessions.length);

        // we couldn't get anyone willing to play with us for now (i.e. no live connections int he queue)
        if (!socket) {
            console.log('no socket found, giving up');
            return;
        }

        shrub.offeredSession = { id: nextSessionUp, expiryDate: generateNewOfferExpiryDate() };
        console.log(`OFFERING SESSION TO ${shrub.offeredSession.id}`);
        socket.emit('sessionOffered', {
            shrubId: shrub.id,
            offerExpiryDate: shrub.offeredSession.expiryDate
        });
        shrub.sendUpdatedWaitTimes();
    };

    shrub.declineOfferedSession = function(socket) {
        let sessionId = socket.request.session.id;

        // ya can't decline a session that's never been offered
        if (!shrub.offeredSession || shrub.offeredSession.id !== sessionId) {
            console.log(`Shrub ${shrub.id} can't decline offered session because session ${sessionId} hasn't been offered.`);
            return;
        }

        socket.emit('sessionOfferRevoked', shrub.id);

        // remove the session from waiting since they don't want control (and from offered)
        removeSessionFromWaitingQueue(shrub.waitingSessions, sessionId);
        delete shrub.offeredSession;

        // give it to the next in line!
        shrub.offerNextSession();
    };

    shrub.acceptOfferedSession = function(socket) {
        let sessionId = socket.request.session.id;

        if (!shrub.offeredSession || shrub.offeredSession.id !== sessionId) {
            console.log(`Shrub ${shrub.id} did not offer session to ${sessionId}. Ignoring.`);
            return;
        }

        // remove the session from waiting since it's becoming active (and from offered)
        removeSessionFromWaitingQueue(shrub.waitingSessions, sessionId);
        delete shrub.offeredSession;

        shrub.activeSession = { id: sessionId, expiryDate: generateNewSessionExpiryDate() };
        socket.emit('sessionActivated', { shrubId: shrub.id, expiryDate: shrub.activeSession.expiryDate });
        shrub.sendUpdatedWaitTimes();
    };

    setInterval(shrub.checkExpiryDates, 1000); // 1 second
});


module.exports = {
    getShrubByID
};