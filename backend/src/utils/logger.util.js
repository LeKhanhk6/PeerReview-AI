import pino from 'pino';
import { getLogContext } from './context.util.js';

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
const withContext = (meta) => {
    const context = getLogContext();
    if (typeof meta === 'string') {
        return { msg: meta, ...context };
    }
    return { ...meta, ...context };
};

const logger = {
    info: (meta) => pinoLogger.info(withContext(meta)),
    error: (meta) => pinoLogger.error(withContext(meta)),
    warn: (meta) => pinoLogger.warn(withContext(meta)),
    debug: (meta) => pinoLogger.debug(withContext(meta)),
};

export default logger;
