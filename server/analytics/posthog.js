const { PostHog } = require('posthog-node');

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || 'phc_Vlo5F0WYJmgCREUUna1TQQ1ZAieDDFyHZZ9lIXcVkMU';

const posthog = new PostHog(POSTHOG_API_KEY, {
    host: 'https://us.i.posthog.com'
});

function captureEvent(eventName, distinctId, properties = {}) {
    posthog.capture({
        distinctId: distinctId || 'server',
        event: eventName,
        properties
    });
}

// Ensure events are flushed on shutdown
process.on('SIGTERM', async () => {
    await posthog.shutdown();
});

process.on('SIGINT', async () => {
    await posthog.shutdown();
});

module.exports = { posthog, captureEvent };
