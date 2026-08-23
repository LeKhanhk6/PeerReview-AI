import { randomUUID } from 'crypto';

/**
 * Middleware to generate and attach a unique request ID to each incoming request.
 * Useful for observability and structured logging tracing.
 */
export const requestIdMiddleware = (req, res, next) => {
    // Check if proxy already passed an x-request-id header
    req.id = req.headers['x-request-id'] || randomUUID();
    
    // Optionally return it to the client
    res.setHeader('x-request-id', req.id);
    
    next();
};
