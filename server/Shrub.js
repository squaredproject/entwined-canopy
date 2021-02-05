const shrubConfigs = require('./config/entwinedShrubs');
let shrubs = [];

let lxSockets = require('./sockets/lx-sockets');

const OFFER_EXPIRATION_PERIOD_SECS = 15.0;
const ACTIVE_SESSION_EXPIRATION_PERIOD_SECS = 60.0;

/* Utility / Helper Functions
 * (that don't need to be tied to the class)
 */ 

 // TODO: move this to a separate utility file
function findUserSocketBySessionID(sessionId) {
    let io = require('./sockets/sockets').io;

    for (var [socketId, socket] of io.of('/user').sockets) {
        if (socket.sessionId === sessionId) {
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

class Shrub {
    constructor(id) {
        // if the ID is an int or anything else, convert to a string so it's easier to work with and match
        this.id = String(id);
        this.waitingSessions = [];

        setInterval(this._checkExpiryDates.bind(this), 1000); // 1 second
    }

    /* Public Instance Methods */

    requestActivateSession(socket) {
        let sessionId = socket.sessionId;

        // if there's nobody currently controlling and nobody offered, just activate the session for them immediately
        // or if they're actually _already_ the active session
        if ((!this.activeSession && !this.offeredSession) || (this.activeSession && this.activeSession.id === sessionId)) {
            delete this.offeredSession;
            // only regenerate the expiry date if they're not already active
            if (!this.activeSession) {
                this.activeSession = { id: sessionId, expiryDate: generateNewSessionExpiryDate() };
            }
            socket.emit('sessionActivated', { shrubId: this.id, expiryDate: this.activeSession.expiryDate });
            lxSockets.emit('interactionStarted', this.id);
            this._sendUpdatedWaitTimes();
            return;
        }

        if (this.offeredSession && this.offeredSession.id == sessionId) {
            // we already offered them a session (probably they just reloaded the page)
            // remind them...
            socket.emit('sessionOffered', {
                shrubId: this.id,
                offerExpiryDate: this.offeredSession.expiryDate
            });
            return;
        }

        // no duplicates in the queue!
        if (!this.waitingSessions.includes(sessionId)) {
            this.waitingSessions.push(sessionId);
        }

        let waitTime = this._estimatedWaitTime(sessionId);
        socket.emit('sessionWaiting', { shrubId: this.id, estimatedWaitTime: waitTime })
    }

    deactivateSession(socket) {
        let sessionId = socket.sessionId;

        // ya can't deactivate a session that's not activated
        if (!this.activeSession || this.activeSession.id !== sessionId) {
            console.log(`Shrub ${this.id} can't deactivate session because it isn't currently active.`);
            return;
        }

        delete this.activeSession;

        socket.emit('sessionDeactivated', this.id);
        lxSockets.emit('interactionStopped', this.id);

        // give it to the next in line!
        this._offerNextSession();
    }

    declineOfferedSession(socket) {
        let sessionId = socket.sessionId;

        // ya can't decline a session that's never been offered
        if (!this.offeredSession || this.offeredSession.id !== sessionId) {
            console.log(`Shrub ${this.id} can't decline offered session because session ${sessionId} hasn't been offered.`);
            return;
        }

        socket.emit('sessionOfferRevoked', this.id);

        // remove the session from waiting since they don't want control (and from offered)
        this._removeSessionFromWaitingQueue(sessionId);
        delete this.offeredSession;

        // give it to the next in line!
        this._offerNextSession();
    }

    acceptOfferedSession(socket) {
        let sessionId = socket.sessionId;

        if (!this.offeredSession || this.offeredSession.id !== sessionId) {
            console.log(`Shrub ${this.id} did not offer session to ${sessionId}. Ignoring.`);
            return;
        }

        // remove the session from waiting since it's becoming active (and from offered)
        this._removeSessionFromWaitingQueue(sessionId);
        delete this.offeredSession;

        this.activeSession = { id: sessionId, expiryDate: generateNewSessionExpiryDate() };
        socket.emit('sessionActivated', { shrubId: this.id, expiryDate: this.activeSession.expiryDate });
        lxSockets.emit('interactionStarted', this.id);
        this._sendUpdatedWaitTimes();
    }

    /* Private Instance Methods */

    _checkExpiryDates() {
        if (this.activeSession && this.activeSession.expiryDate.getTime() <= Date.now()) {
            let socket = findUserSocketBySessionID(this.activeSession.id);
            if (socket) {
                socket.emit('sessionDeactivated', this.id);
            } else {
                console.log(`Can't find socket for ${this.activeSession.id} to send deactivation notice.`);
            }
            lxSockets.emit('interactionStopped', this.id);

            delete this.activeSession;

            // give it to the next in line!
            this._offerNextSession();
        } else if (this.offeredSession && this.offeredSession.expiryDate.getTime() <= Date.now()) {
            let socket = findUserSocketBySessionID(this.offeredSession.id);
            if (socket) {
                socket.emit('sessionOfferRevoked', this.id);
            } else {
                console.log(`Can't find socket for ${this.offeredSession.id} to send offer revocation notice.`);
            }

            // move their session to the back of the queue and keep going
            this._moveSessionToBackOfQueue(this.offeredSession.id);
            delete this.offeredSession;
    
            // give it to the next in line!
            this._offerNextSession();
        }
    }

    _sendUpdatedWaitTimes() {
        this.waitingSessions.forEach((sessionId) => {
            // if a session has already been offered, don't send a wait time
            if (this.offeredSession && sessionId === this.offeredSession.id) return;

            let socket = findUserSocketBySessionID(sessionId);
            if (socket) {
                let waitTime = this._estimatedWaitTime(sessionId);
                socket.emit('waitTimeUpdated', { shrubId: this.id, estimatedWaitTime: waitTime });
            }            
        });
    }

    _offerNextSession() {
        console.log('offer next session!');
        // if the queue's empty, we're done! nobody else is waiting.
        if (!this.waitingSessions.length) {
            console.log('no waiting queue found, giving up');
            return;
        }

        // find the next session (assuming)
        var nextSessionUp;
        var socket;
        do {
            nextSessionUp = this.waitingSessions[0];
            socket = findUserSocketBySessionID(nextSessionUp);
            console.log(`Found socket for ${nextSessionUp}? ${!!socket}`);

            if (!socket) {
                console.log(`Can't find socket for ${nextSessionUp} to offer the next active session, removing from waiting queue.`);

                this._removeSessionFromWaitingQueue(nextSessionUp);
            }
        } while (!socket && this.waitingSessions.length);

        // we couldn't get anyone willing to play with us for now (i.e. no live connections int he queue)
        if (!socket) {
            console.log('no socket found, giving up');
            return;
        }

        this.offeredSession = { id: nextSessionUp, expiryDate: generateNewOfferExpiryDate() };
        console.log(`OFFERING SESSION TO ${this.offeredSession.id}`);
        socket.emit('sessionOffered', {
            shrubId: this.id,
            offerExpiryDate: this.offeredSession.expiryDate
        });
        this._sendUpdatedWaitTimes();
    }

    _estimatedWaitTime(sessionId) {
        let sessionIndex = this.waitingSessions.indexOf(sessionId);
        if (sessionIndex < 0) return 0;
    
        // if the session already has an offer, it's always a 0
        if (this.offeredSession && this.offeredSession.id === sessionId) return 0;
    
        let activeWaitTime = this.activeSession ? Math.max(this.activeSession.expiryDate.getTime() - Date.now(), 0) : 0;
        let queueWaitTime = (sessionIndex + (this.offeredSession ? 1 : 0)) * ACTIVE_SESSION_EXPIRATION_PERIOD_SECS * 1000;
    
        // return the value in seconds
        return (activeWaitTime + queueWaitTime) / 1000;
    }

    _removeSessionFromWaitingQueue(sessionId) {
        let sessionIndex = this.waitingSessions.indexOf(sessionId);
        if (sessionIndex >= 0) {
            this.waitingSessions.splice(sessionIndex, 1);
        }
    }
    _moveSessionToBackOfQueue(sessionId) {
        this._removeSessionFromWaitingQueue(sessionId);
        this.waitingSessions.push(sessionId);
    }
    
}

// make all the shrubs
shrubConfigs.forEach(function(shrubConfig) {
   shrubs.push(new Shrub(shrubConfig.id));
});


module.exports = {
    getShrubByID
};