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
        if (isolationLevel) {
            await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
        } else {
            await client.query('BEGIN');
        }

        const result = await callback(client);
        
        await client.query('COMMIT');
        return result;
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        logger.error({ event: 'transaction.rollback', error: error.message });
        if (error.isOperational || (error.status >= 400 && error.status < 600) || error.code) {
            throw error;
        }
        throw new AppError(error.message || 'Transaction failed', 500, 'INTERNAL_ERROR', { original: error.message });
    } finally {
        if (client) client.release();
    }
};
