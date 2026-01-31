const { getPool } = require('./db');

function logEvent(eventType, sessionId, installationId, pieceId, eventData = null) {
    const pool = getPool();
    if (!pool) return;

    pool.query(
        `INSERT INTO analytics_events (session_id, installation_id, piece_id, event_type, event_data)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, installationId || '', pieceId || null, eventType, eventData ? JSON.stringify(eventData) : null]
    ).catch(err => {
        console.error('Analytics log error:', err.message);
    });
}

module.exports = { logEvent };
