import pino from 'pino';

// Initialize core Pino logger
// Standardizes output to JSON format natively
const pinoLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    }
});

/**
 * Custom Logger Wrapper
 * Ensures structured logging patterns across the application.
 */
const logger = {
    info: (meta) => pinoLogger.info(meta),
    error: (meta) => pinoLogger.error(meta),
    warn: (meta) => pinoLogger.warn(meta),
    debug: (meta) => pinoLogger.debug(meta),
};

export default logger;
