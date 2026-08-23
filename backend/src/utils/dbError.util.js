import AppError from './AppError.js';
import logger from './logger.util.js';

/**
 * Centralized DB Error Mapper
 * Maps PostgreSQL specific error codes to HTTP AppErrors
 * 
 * @param {Error} error - The caught database error
 * @param {string} customMessage - (Optional) Custom message to override defaults or add context
 * @returns {AppError} - Standardized AppError to be thrown
 */
export const mapDbError = (error, customMessage = null) => {
    logger.error({
        event: 'db.error',
        code: error.code,
        message: error.message
    });
    
    // 23505: unique_violation
    if (error.code === '23505') {
        return new AppError(customMessage || 'Conflict: Record already exists.', 409, { original: error.message });
    }
    
    // 55P03: lock_not_available (Used in FOR UPDATE NOWAIT)
    if (error.code === '55P03') {
        return new AppError(customMessage || 'Conflict: Resource is currently being modified by another process. Please try again.', 409);
    }
    
    // 23503: foreign_key_violation
    if (error.code === '23503') {
        return new AppError(customMessage || 'Invalid reference: The associated record does not exist.', 400, { original: error.message });
    }

    // 40001: serialization_failure (Transaction conflict in isolation levels)
    if (error.code === '40001') {
        return new AppError(customMessage || 'Conflict: Transaction serialization failure. Please retry your request.', 409, { original: error.message });
    }

    // Default mapping for unknown DB errors
    return new AppError(customMessage || error.message || 'Database operation failed', 500, { original: error.message });
};
