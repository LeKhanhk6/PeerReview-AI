import pool from '../config/db.js';
import { AppError } from './AppError.js';
import logger from './logger.util.js';

/**
 * Executes a callback within a database transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 * Ensures strict concurrency control if needed via isolationLevel.
 * 
 * @param {Function} callback - Async function receiving the pg client
 * @param {string} [isolationLevel='REPEATABLE READ'] - Transaction isolation level
 */
export const withTransaction = async (callback, isolationLevel = 'REPEATABLE READ') => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        if (isolationLevel) {
            await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
        }

        const result = await callback(client);
        
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error({ event: 'transaction.rollback', error: error.message });
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(error.message || 'Transaction failed', 500, 'INTERNAL_ERROR', { original: error.message });
    } finally {
        client.release();
    }
};
