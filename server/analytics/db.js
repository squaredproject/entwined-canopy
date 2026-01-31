const { Pool } = require('pg');

let pool = null;
let warned = false;

function getPool() {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            if (!warned) {
                console.warn('DATABASE_URL not set - analytics disabled');
                warned = true;
            }
            return null;
        }

        pool = new Pool({
            connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 5,
        });

        pool.on('error', (err) => {
            console.error('Analytics DB pool error:', err);
        });
    }
    return pool;
}

async function initializeSchema() {
    const db = getPool();
    if (!db) return;

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS analytics_events (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                session_id VARCHAR(64) NOT NULL,
                installation_id VARCHAR(64) NOT NULL,
                piece_id VARCHAR(64),
                event_type VARCHAR(32) NOT NULL,
                event_data JSONB
            )
        `);

        await db.query(`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(timestamp)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_events_installation ON analytics_events(installation_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id)`);

        console.log('Analytics schema initialized');
    } catch (err) {
        console.error('Failed to initialize analytics schema:', err);
    }
}

module.exports = { getPool, initializeSchema };
