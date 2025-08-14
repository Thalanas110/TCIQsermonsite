const { db } = require('../config/database');
const { system_logs } = require('../config/schema/logs');

/**
 * Log a system event
 * @param {string} level - Log level (info, warning, error, security)
 * @param {string} category - Log category (auth, admin, content, system)
 * @param {string} message - Log message
 * @param {string} [details] - Additional details (optional)
 */
async function logSystemEvent(level, category, message, details = null) {
    try {
        await db.insert(system_logs).values({
            level,
            category,
            message,
            details: details ? JSON.stringify(details) : null,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error logging system event:', error);
    }
}

module.exports = {
    logSystemEvent
};
