const { db } = require('../config/database');
const { system_logs } = require('../config/schema/logs');

const logLevels = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    DEBUG: 'debug'
};

const logCategories = {
    AUTH: 'authentication',
    CONTENT: 'content',
    SYSTEM: 'system',
    DATABASE: 'database',
    SECURITY: 'security'
};

async function log(level, category, message, details = null) {
    try {
        await db.insert(system_logs).values({
            level,
            category,
            message,
            details: details ? JSON.stringify(details) : null
        });
    } catch (error) {
        console.error('Error writing to system logs:', error);
        // Write to fallback log file or console in case DB logging fails
        console.error({
            timestamp: new Date(),
            level,
            category,
            message,
            details
        });
    }
}

// Convenience methods for different log levels
const logger = {
    info: (category, message, details) => log(logLevels.INFO, category, message, details),
    warning: (category, message, details) => log(logLevels.WARNING, category, message, details),
    error: (category, message, details) => log(logLevels.ERROR, category, message, details),
    debug: (category, message, details) => log(logLevels.DEBUG, category, message, details),
    
    // Constants for consistent usage
    levels: logLevels,
    categories: logCategories
};

module.exports = logger;
