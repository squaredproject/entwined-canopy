const shrubConfigs = require('./config/entwinedShrubs');
let shrubs = [];

let lxSockets = require('./sockets/lx-sockets');

const OFFER_EXPIRATION_PERIOD_SECS = 15.0;
const ACTIVE_SESSION_EXPIRATION_PERIOD_SECS = 60.0;

/* Utility / Helper Functions
 * (that don't need to be tied to the class)
 */ 

 // TODO: move this to a separate utility file
function findUserSocketsBySessionIDForShrub(sessionId, shrubId) {
    let io = require('./sockets/sockets').io;

    let ret = [];
    for (var [socketId, socket] of io.of('/user').sockets) {
        if (socket.sessionId === sessionId && socket.shrubId === shrubId) {
            ret.push(socket);
        }
    }
    if (ret.length > 1) {
        console.log(`Multiple sockets (${ret.length}) found for user session ${sessionId} and shrub ID ${shrubId}`);
    }

    return ret;
}
function socketConnectedForSessionOnShrub(sessionId, shrubId) {
    return findUserSocketsBySessionIDForShrub(sessionId, shrubId).length > 0;
}
function emitToSessionOnShrub(eventName, dataObj, sessionId, shrubId) {
    let sockets = findUserSocketsBySessionIDForShrub(sessionId, shrubId);
    if (sockets.length > 0) {
        sockets.forEach((socket) => {
            socket.emit(eventName, dataObj);
        });
    }
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
                console.log(`Shrub ${this.id}: activated session ${sessionId}`);
                this.activeSession = { id: sessionId, expiryDate: generateNewSessionExpiryDate() };
            } else {
                console.log(`Shrub ${this.id}: reactivated session ${sessionId}`);
            }
            emitToSessionOnShrub('sessionActivated', { shrubId: this.id, expiryDate: this.activeSession.expiryDate }, sessionId, this.id);
            lxSockets.emit('interactionStarted', this.id);
            this._sendUpdatedWaitTimes();
            return;
        }

        if (this.offeredSession && this.offeredSession.id == sessionId) {
            // we already offered them a session (probably they just reloaded the page)
            // remind them...
            emitToSessionOnShrub('sessionOffered', {
                shrubId: this.id,
                offerExpiryDate: this.offeredSession.expiryDate
            }, sessionId, this.id);
            console.log(`Shrub ${this.id}: reoffered session ${sessionId}`);
            return;
        }

        // no duplicates in the queue!
        if (!this.waitingSessions.includes(sessionId)) {
            console.log(`Shrub ${this.id}: placed session ${sessionId} in waiting queue`);
            this.waitingSessions.push(sessionId);
        } else {
            console.log(`Shrub ${this.id}: reminded session ${sessionId} of spot in waiting queue`);
        }

        let waitTime = this._estimatedWaitTime(sessionId);
        emitToSessionOnShrub('sessionWaiting', { shrubId: this.id, estimatedWaitTime: waitTime }, sessionId, this.id);
    }

    deactivateSession(socket) {
        let sessionId = socket.sessionId;

        // ya can't deactivate a session that's not activated
        if (!this.activeSession || this.activeSession.id !== sessionId) {
            console.log(`Shrub ${this.id} can't deactivate session ${sessionId} because it isn't currently active.`);
            return;
        }

        delete this.activeSession;

        emitToSessionOnShrub('sessionDeactivated', this.id, sessionId, this.id);
        lxSockets.emit('interactionStopped', this.id);

        console.log(`Shrub ${this.id}: deactivated session ${sessionId} by request`);

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

        emitToSessionOnShrub('sessionOfferRevoked', this.id, sessionId, this.id);

        // remove the session from waiting since they don't want control (and from offered)
        this._removeSessionFromWaitingQueue(sessionId);
        delete this.offeredSession;

        console.log(`Shrub ${this.id}: session ${sessionId} declined offer`);

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

        console.log(`Shrub ${this.id}: session ${sessionId} accepted offer`);

        this.activeSession = { id: sessionId, expiryDate: generateNewSessionExpiryDate() };
        emitToSessionOnShrub('sessionActivated', { shrubId: this.id, expiryDate: this.activeSession.expiryDate }, sessionId, this.id);
        lxSockets.emit('interactionStarted', this.id);
        this._sendUpdatedWaitTimes();
    }

    /* Private Instance Methods */

    _checkExpiryDates() {
        if (this.activeSession && this.activeSession.expiryDate.getTime() <= Date.now()) {
            let socketConnected = socketConnectedForSessionOnShrub(this.activeSession.id, this.id);

            // if nobody else is waiting in line, just extend the session!
            if (socketConnected && !this.waitingSessions.length) {
                console.log(`Shrub ${this.id}: extending session for ${this.activeSession.id} because no other users are waiting`);
                this.activeSession.expiryDate = generateNewSessionExpiryDate();
                emitToSessionOnShrub('sessionActivated', { shrubId: this.id, expiryDate: this.activeSession.expiryDate }, this.activeSession.id, this.id);
                return;
            }

            if (socketConnected) {
                emitToSessionOnShrub('sessionDeactivated', this.id, this.activeSession.id, this.id);
                console.log(`Shrub ${this.id}: session ${this.activeSession.id} expired and deactivated`);
            } else {
                console.log(`Shrub ${this.id}: can't find socket for ${this.activeSession.id} to send expiry deactivation notice.`);
            }
            lxSockets.emit('interactionStopped', this.id);

            delete this.activeSession;

            // give it to the next in line!
            this._offerNextSession();
        } else if (this.offeredSession && this.offeredSession.expiryDate.getTime() <= Date.now()) {
            let socketConnected = socketConnectedForSessionOnShrub(this.offeredSession.id, this.id);

            // if nobody else is waiting in line, just extend the offer!
            if (socketConnected && this.waitingSessions.length <= 1) {
                console.log(`Shrub ${this.id}: extending offer for ${this.offeredSession.id} because no other users are waiting`);
                this.offeredSession.expiryDate = generateNewOfferExpiryDate();
                emitToSessionOnShrub('sessionOffered', {
                    shrubId: this.id,
                    offerExpiryDate: this.offeredSession.expiryDate
                }, this.offeredSession.id, this.id);
                return;
            }

            if (socketConnected) {
                emitToSessionOnShrub('sessionOfferRevoked', this.id, this.offeredSession.id, this.id);
                console.log(`Shrub ${this.id}: offer for session ${this.offeredSession.id} expired and revoked`);
            } else {
                console.log(`Shrub ${this.id}: can't find socket for ${this.offeredSession.id} to send offer expiry revocation notice.`);
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

            if (socketConnectedForSessionOnShrub(sessionId, this.id)) {
                let waitTime = this._estimatedWaitTime(sessionId);
                emitToSessionOnShrub('waitTimeUpdated', { shrubId: this.id, estimatedWaitTime: waitTime }, this.activeSession.id, this.id);
            }            
        });
    }

    _offerNextSession() {
        console.log(`Shrub ${this.id}: offering next session...`);
        // if the queue's empty, we're done! nobody else is waiting.
        if (!this.waitingSessions.length) {
            console.log(`Shrub ${this.id}: no waiting sessions to offer to`);
            return;
        }

        // find the next session (assuming)
        var nextSessionUp;
        var socketConnected;
        do {
            nextSessionUp = this.waitingSessions[0];
            socketConnected = socketConnectedForSessionOnShrub(nextSessionUp, this.id)

            if (!socketConnected) {
                console.log(`Shrub ${this.id}: can't find socket for ${nextSessionUp} to offer the next active session, removing from waiting queue.`);

                this._removeSessionFromWaitingQueue(nextSessionUp);
            }
        } while (!socketConnected  && this.waitingSessions.length);

        // we couldn't get anyone willing to play with us for now (i.e. no live connections int he queue)
        if (!socketConnected) {
            console.log(`Shrub ${this.id}: no valid socket to offer to`);
            return;
        }

        this.offeredSession = { id: nextSessionUp, expiryDate: generateNewOfferExpiryDate() };
        console.log(`Shrub ${this.id}: offering session to ${this.offeredSession.id}`);
        emitToSessionOnShrub('sessionOffered', {
            shrubId: this.id,
            offerExpiryDate: this.offeredSession.expiryDate
        }, this.offeredSession.id, this.id);
        this._sendUpdatedWaitTimes();
    }

    _estimatedWaitTime(sessionId) {
        let sessionIndex = this.waitingSessions.indexOf(sessionId);
        if (sessionIndex < 0) return 0;
    
        // if the session already has an offer, it's always a 0
        if (this.offeredSession && this.offeredSession.id === sessionId) return 0;
    
        let activeWaitTime = this.activeSession ? Math.max(this.activeSession.expiryDate.getTime() - Date.now(), 0) : 0;
        let queueWaitTime = sessionIndex * ACTIVE_SESSION_EXPIRATION_PERIOD_SECS * 1000;
    
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