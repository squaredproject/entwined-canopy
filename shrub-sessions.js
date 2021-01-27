const shrubs = require('./entwinedShrubs');

// TODO: move this to a utility class?
function findSocketBySessionID(sessionId) {
    let io = require('./socketAPI').io;
    

    for (var [socketId, socket] of io.sockets) {
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

// TODO: should this really be a class, not just a weird bunch of methods added to each shrub?
shrubs.forEach(function(shrub) {
    // if the ID is an int or anything else, convert to a string so it's easier to work with
    // and match
    shrub.id = String(shrub.id);
    shrub.waitingSessions = [];

    shrub.requestActivateSession = function(socket) {
        let sessionId = socket.request.session.id;

        // if there's nobody currently controlling, just activate the session for them immediately
        // or if they're actually _already_ the active session
        if (!shrub.activeSession || shrub.activeSession === sessionId) {
            delete shrub.offeredSession;
            shrub.activeSession = sessionId;
            socket.emit('sessionActivated', shrub.id);
            return;
        }

        // no duplicates in the queue!
        if (!shrub.waitingSessions.includes(sessionId)) {
            shrub.waitingSessions.push(sessionId);
        }

        // TODO: use a proper wait time estimate here
        socket.emit('sessionWaiting', { shrubId: shrub.id, estimatedWaitTime: shrub.waitingSessions.length * 60 })
    }

    shrub.offerNextSession = function() {
        let nextSessionUp = shrub.waitingSessions[0];

        // if the queue's empty, we're done! nobody else is waiting.
        if (!nextSessionUp) {
            return;
        }

        shrub.offeredSession = nextSessionUp.id;

        let socket = findSocketBySessionID(nextSessionUp.id);
        socket.emit('sessionOffered', shrub.id);
    };

    // TODO: since any socket can call this, couldn't one person decline a session for somebody else?
    // seems like a security glitch
    shrub.declineOfferedSession = function() {
        // ya can't decline a session that's never been offered
        if (!shrub.offeredSession) {
            console.log(`Shrub ${shrub.id} can't decline offered session because no session has been offered.`);
            return;
        }

        delete shrub.offeredSession;

        let socket = findSocketBySessionID(nextSessionUp.id);
        socket.emit('sessionOfferRevoked', shrub.id);

        // give it to the next in line!
        shrub.offerNextSession();
    };

    shrub.acceptOfferedSession = function(socket) {
        let sessionId = socket.request.session.id;

        if (shrub.offeredSession !== sessionId) {
            console.log(`Shrub ${shrub.id} did not offer session to ${sessionId}. Ignoring.`);
            return;
        }

        // remove the session from waiting since it's becoming active
        let sessionIndex = shrub.waitingSessions.findIndex(function(session) {
            return sessionId === session.id;
        });
        shrub.waitingSessions.splice(sessionIndex, 1);

        shrub.activeSession = sessionId;
        socket.emit('sessionActivated', shrub.id);
    };
});


module.exports = {
    getShrubByID
};