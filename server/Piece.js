const installationConfigs = require('./config/entwinedInstallations');
const { captureEvent } = require('./analytics/posthog');
let installations = {};

let lxSockets = require('./sockets/lx-sockets');

const OFFER_EXPIRATION_PERIOD_SECS = 15.0;
const ACTIVE_SESSION_EXPIRATION_PERIOD_SECS = 60.0;

const INACTIVITY_WARN_THRESHOLD = 15.0; // 15 seconds
const INACTIVITY_DEACTIVATE_THRESHOLD = 30.0;// 30 seconds
const DISCONNECTION_DEACTIVATE_THRESHOLD = 10.0; // 10 seconds
const ACTION_CACHE_MAXAGE = 60.0; // 1 minute

/* Utility / Helper Functions
 * (that don't need to be tied to the class)
 */ 

 // TODO: move this to a separate utility file
function findUserSocketsBySessionIDForPiece(sessionId, installationId, pieceId) {
    let io = require('./sockets/sockets').io;

    let ret = [];
    for (var [socketId, socket] of io.of('/user').sockets) {
        if (socket.sessionId === sessionId && socket.installationId === installationId && socket.pieceId === pieceId) {
            ret.push(socket);
        }
    }
    if (ret.length > 1) {
        console.log(`Multiple sockets (${ret.length}) found for user session ${sessionId}, installation ID ${installationId}, piece ID ${pieceId}`);
    }

    return ret;
}
function socketConnectedForSessionOnPiece(sessionId, installationId, pieceId) {
    return findUserSocketsBySessionIDForPiece(sessionId, installationId, pieceId).length > 0;
}
function emitToSessionOnPiece(eventName, dataObj, sessionId, installationId, pieceId) {
    dataObj = dataObj || {};
    dataObj.installationId = installationId;
    dataObj.pieceId = pieceId;

    let sockets = findUserSocketsBySessionIDForPiece(sessionId, installationId, pieceId);
    if (sockets.length > 0) {
        sockets.forEach((socket) => {
            socket.emit(eventName, dataObj);
        });
    }
} 

function getPieceByID(installationId, pieceId) {
    installationId = String(installationId);
    pieceId = String(pieceId);

    if (!installations[installationId]) return null;

    return installations[installationId].find(function(piece) {
        return String(piece.id) === pieceId;
    });
}

function generateNewSessionExpiryDate() {
    return new Date(Date.now() + (ACTIVE_SESSION_EXPIRATION_PERIOD_SECS * 1000));
}
function generateNewOfferExpiryDate() {
    return new Date(Date.now() + (OFFER_EXPIRATION_PERIOD_SECS * 1000));
}

class Piece {
    constructor(installationId, pieceId) {
        // if the ID is an int or anything else, convert to a string so it's easier to work with and match
        this.installationId = String(installationId);
        this.id = String(pieceId);
        this.waitingSessions = [];
        this.sessionLastActions = {};

        setInterval(this._checkExpiryDates.bind(this), 1000); // 1 second
        setInterval(this._checkActiveSessionInactivity.bind(this), 2500); // 2.5 seconds
        setInterval(this._purgeLastActionCache.bind(this), 60000); // 1 minute
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
                console.log(`Piece ${this.id} (${this.installationId}): activated session ${sessionId}`);
                this.activeSession = { id: sessionId, expiryDate: generateNewSessionExpiryDate() };
                captureEvent('session_activated', sessionId, {
                    installation_id: this.installationId,
                    piece_id: this.id
                });
            } else {
                console.log(`Piece ${this.id} (${this.installationId}): reactivated session ${sessionId}`);
            }
            emitToSessionOnPiece('sessionActivated', { expiryDate: this.activeSession.expiryDate }, sessionId, this.installationId, this.id);
            lxSockets.emit('interactionStarted', null, this.installationId, this.id);
            this._sendUpdatedWaitTimes();
            return;
        }

        if (this.offeredSession && this.offeredSession.id == sessionId) {
            // we already offered them a session (probably they just reloaded the page)
            // remind them...
            emitToSessionOnPiece('sessionOffered', {
                offerExpiryDate: this.offeredSession.expiryDate
            }, sessionId, this.id);
            console.log(`Piece ${this.id} (${this.installationId}): reoffered session ${sessionId}`);
            return;
        }

        // no duplicates in the queue!
        if (!this.waitingSessions.includes(sessionId)) {
            console.log(`Piece ${this.id} (${this.installationId}): placed session ${sessionId} in waiting queue`);
            this.waitingSessions.push(sessionId);
        } else {
            console.log(`Piece ${this.id} (${this.installationId}): reminded session ${sessionId} of spot in waiting queue`);
        }

        let waitTime = this._estimatedWaitTime(sessionId);
        emitToSessionOnPiece('sessionWaiting', { estimatedWaitTime: waitTime }, sessionId, this.installationId, this.id);
    }

    deactivateSession(socket) {
        let sessionId = socket.sessionId;

        // ya can't deactivate a session that's not activated
        if (!this.activeSession || this.activeSession.id !== sessionId) {
            console.log(`Piece ${this.id} (${this.installationId}) can't deactivate session ${sessionId} because it isn't currently active.`);
            return;
        }

        delete this.activeSession;

        emitToSessionOnPiece('sessionDeactivated', null, sessionId, this.installationId, this.id);
        lxSockets.emit('interactionStopped', null, this.installationId, this.id);
        captureEvent('session_deactivated', sessionId, {
            installation_id: this.installationId,
            piece_id: this.id,
            reason: 'user_request'
        });

        console.log(`Piece ${this.id} (${this.installationId}): deactivated session ${sessionId} by request`);

        // give it to the next in line!
        this._offerNextSession();
    }

    declineOfferedSession(socket) {
        let sessionId = socket.sessionId;

        // ya can't decline a session that's never been offered
        if (!this.offeredSession || this.offeredSession.id !== sessionId) {
            console.log(`Piece ${this.id} (${this.installationId}) can't decline offered session because session ${sessionId} hasn't been offered.`);
            return;
        }

        emitToSessionOnPiece('sessionOfferRevoked', null, sessionId, this.installationId, this.id);

        // remove the session from waiting since they don't want control (and from offered)
        this._removeSessionFromWaitingQueue(sessionId);
        delete this.offeredSession;

        console.log(`Piece ${this.id} (${this.installationId}): session ${sessionId} declined offer`);

        // give it to the next in line!
        this._offerNextSession();
    }

    acceptOfferedSession(socket) {
        let sessionId = socket.sessionId;

        if (!this.offeredSession || this.offeredSession.id !== sessionId) {
            console.log(`Piece ${this.id} (${this.installationId}) did not offer session to ${sessionId}. Ignoring.`);
            return;
        }

        // remove the session from waiting since it's becoming active (and from offered)
        this._removeSessionFromWaitingQueue(sessionId);
        delete this.offeredSession;

        console.log(`Piece ${this.id} (${this.installationId}): session ${sessionId} accepted offer`);

        this.activeSession = { id: sessionId, expiryDate: generateNewSessionExpiryDate() };
        emitToSessionOnPiece('sessionActivated', { expiryDate: this.activeSession.expiryDate }, sessionId, this.installationId, this.id);
        lxSockets.emit('interactionStarted', null, this.installationId, this.id);
        captureEvent('session_activated', sessionId, {
            installation_id: this.installationId,
            piece_id: this.id
        });
        this._sendUpdatedWaitTimes();
    }

    recordActionForSession(sessionId) {
        this.sessionLastActions[sessionId] = Date.now();
    }

    /* Private Instance Methods */

    _checkExpiryDates() {
        if (this.activeSession && this.activeSession.expiryDate.getTime() <= Date.now()) {
            let socketConnected = socketConnectedForSessionOnPiece(this.activeSession.id, this.installationId, this.id);

            // if nobody else is waiting in line, just extend the session!
            if (socketConnected && !this.waitingSessions.length) {
                console.log(`Piece ${this.id} (${this.installationId}): extending session for ${this.activeSession.id} because no other users are waiting`);
                this.activeSession.expiryDate = generateNewSessionExpiryDate();
                emitToSessionOnPiece('sessionActivated', { expiryDate: this.activeSession.expiryDate }, this.activeSession.id, this.installationId, this.id);
                return;
            }

            if (socketConnected) {
                emitToSessionOnPiece('sessionDeactivated', null, this.activeSession.id, this.installationId, this.id);
                console.log(`Piece ${this.id} (${this.installationId}): session ${this.activeSession.id} expired and deactivated`);
            } else {
                console.log(`Piece ${this.id} (${this.installationId}): can't find socket for ${this.activeSession.id} to send expiry deactivation notice.`);
            }
            lxSockets.emit('interactionStopped', null, this.installationId, this.id);
            captureEvent('session_deactivated', this.activeSession.id, {
                installation_id: this.installationId,
                piece_id: this.id,
                reason: 'expired'
            });

            delete this.activeSession;

            // give it to the next in line!
            this._offerNextSession();
        } else if (this.offeredSession && this.offeredSession.expiryDate.getTime() <= Date.now()) {
            let socketConnected = socketConnectedForSessionOnPiece(this.offeredSession.id, this.installationId, this.id);

            // if nobody else is waiting in line, just extend the offer!
            if (socketConnected && this.waitingSessions.length <= 1) {
                console.log(`Piece ${this.id} (${this.installationId}): extending offer for ${this.offeredSession.id} because no other users are waiting`);
                this.offeredSession.expiryDate = generateNewOfferExpiryDate();
                emitToSessionOnPiece('sessionOffered', {
                    offerExpiryDate: this.offeredSession.expiryDate
                }, this.offeredSession.id, this.id);
                return;
            }

            if (socketConnected) {
                emitToSessionOnPiece('sessionOfferRevoked', null, this.offeredSession.id, this.installationId, this.id);
                console.log(`Piece ${this.id} (${this.installationId}): offer for session ${this.offeredSession.id} expired and revoked`);
            } else {
                console.log(`Piece ${this.id} (${this.installationId}): can't find socket for ${this.offeredSession.id} to send offer expiry revocation notice.`);
            }

            // move their session to the back of the queue and keep going
            this._moveSessionToBackOfQueue(this.offeredSession.id);
            delete this.offeredSession;
    
            // give it to the next in line!
            this._offerNextSession();
        }
    }

    _checkActiveSessionInactivity() {
        if (!this.activeSession) return;

        let lastAction = this.sessionLastActions[this.activeSession.id] || 0;
        let msSinceLastAction = Date.now() - lastAction;
        
        // if they're over the deactivation threshold, kill their session
        // OR if they're disconnected and over the disconnected session threshold, kill their session earlier
        if (msSinceLastAction > (INACTIVITY_DEACTIVATE_THRESHOLD * 1000) ||
            (msSinceLastAction > (DISCONNECTION_DEACTIVATE_THRESHOLD * 1000) && !socketConnectedForSessionOnPiece(this.activeSession.id, this.installationId, this.id))
            ) {
            console.log(`Piece ${this.id} (${this.installationId}): ending session for ${this.activeSession.id} because it was inactive for ${Math.round(msSinceLastAction / 1000)} seconds`);
            emitToSessionOnPiece('sessionDeactivated', null, this.activeSession.id, this.installationId, this.id);

            lxSockets.emit('interactionStopped', null, this.installationId, this.id);
            captureEvent('session_deactivated', this.activeSession.id, {
                installation_id: this.installationId,
                piece_id: this.id,
                reason: 'inactivity'
            });
            delete this.activeSession;

            // give it to the next in line!
            this._offerNextSession();
        } else if (msSinceLastAction > (INACTIVITY_WARN_THRESHOLD * 1000)) {
            // otherwise, if they're past the warning threshold, let them know to do something
            console.log(`Piece ${this.id} (${this.installationId}): sent inactivity warning to session ${this.activeSession.id} because it was inactive for ${Math.round(msSinceLastAction / 1000)} seconds`);
            let deadlineTimestamp = lastAction + (INACTIVITY_DEACTIVATE_THRESHOLD * 1000);
            emitToSessionOnPiece('inactivityWarning', { deadline: deadlineTimestamp }, this.activeSession.id, this.installationId, this.id);
        }
    }

    _sendUpdatedWaitTimes() {
        this.waitingSessions.forEach((sessionId) => {
            // if a session has already been offered, don't send a wait time
            if (this.offeredSession && sessionId === this.offeredSession.id) return;

            if (socketConnectedForSessionOnPiece(sessionId, this.installationId, this.id)) {
                let waitTime = this._estimatedWaitTime(sessionId);
                emitToSessionOnPiece('waitTimeUpdated', { estimatedWaitTime: waitTime }, sessionId, this.installationId, this.id);
            }            
        });
    }

    _offerNextSession() {
        console.log(`Piece ${this.id} (${this.installationId}): offering next session...`);
        // if the queue's empty, we're done! nobody else is waiting.
        if (!this.waitingSessions.length) {
            console.log(`Piece ${this.id} (${this.installationId}): no waiting sessions to offer to`);
            return;
        }

        // find the next session (assuming)
        var nextSessionUp;
        var socketConnected;
        do {
            nextSessionUp = this.waitingSessions[0];
            socketConnected = socketConnectedForSessionOnPiece(nextSessionUp, this.installationId, this.id)

            if (!socketConnected) {
                console.log(`Piece ${this.id} (${this.installationId}): can't find socket for ${nextSessionUp} to offer the next active session, removing from waiting queue.`);

                this._removeSessionFromWaitingQueue(nextSessionUp);
            }
        } while (!socketConnected  && this.waitingSessions.length);

        // we couldn't get anyone willing to play with us for now (i.e. no live connections int he queue)
        if (!socketConnected) {
            console.log(`Piece ${this.id} (${this.installationId}): no valid socket to offer to`);
            return;
        }

        this.offeredSession = { id: nextSessionUp, expiryDate: generateNewOfferExpiryDate() };
        console.log(`Piece ${this.id} (${this.installationId}): offering session to ${this.offeredSession.id}`);
        emitToSessionOnPiece('sessionOffered', {
            offerExpiryDate: this.offeredSession.expiryDate
        }, this.offeredSession.id, this.installationId, this.id);
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
    
    _purgeLastActionCache() {
        let sessionIds = Object.keys(this.sessionLastActions);
        sessionIds.forEach((sessionId) => {
            let lastAction = this.sessionLastActions[sessionId];
            // if the last action was more than the MAXAGE ago, and there's no socket connected, we don't need to remember it
            if (Date.now() - lastAction > (ACTION_CACHE_MAXAGE * 1000) && !socketConnectedForSessionOnPiece(sessionId, this.installationId, this.id)) {
                delete this.sessionLastActions[sessionId];
            }
        });
    }
}

// make all the pieces
Object.keys(installationConfigs).forEach(function(installationId) {
    installations[installationId] = [];

    installationConfigs[installationId].pieces.forEach(function(pieceConfig) {
        installations[installationId].push(new Piece(installationId, pieceConfig.id));
    });
});


module.exports = {
    getPieceByID
};



