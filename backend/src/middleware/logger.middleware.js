import crypto from 'crypto';
import { runWithContext, CONTEXT_KEYS } from '../utils/context.util.js';
import logger from '../utils/logger.util.js';

export const requestLogger = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.id = requestId;
    res.setHeader('x-request-id', requestId);
    const startTime = Date.now();
    
    // We don't have req.user yet, but we will update the store later or let it be extracted when needed.
    runWithContext({ [CONTEXT_KEYS.REQUEST_ID]: requestId }, () => {
        // Log request start
        logger.info({
            event: 'request.start',
            method: req.method,
            url: req.originalUrl,
            ip: req.ip
        });

        // Intercept finish to log complete
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const statusCode = res.statusCode;
            
            // If it's an error, it will be logged by errorHandler, but we can log basic completion here.
            if (statusCode >= 400) {
                logger.error({
                    event: 'request.error',
                    statusCode,
                    duration,
                    method: req.method,
                    url: req.originalUrl
                });
            } else {
                logger.info({
                    event: 'request.complete',
                    statusCode,
                    duration,
                    method: req.method,
                    url: req.originalUrl
                });
            }
        });

        next();
    });
};
