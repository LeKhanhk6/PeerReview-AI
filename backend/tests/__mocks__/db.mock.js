// tests/__mocks__/db.mock.js
import { jest } from '@jest/globals';

const pool = {
    query: jest.fn(),
    connect: jest.fn().mockImplementation(async () => {
        return {
            query: (...args) => {
                const q = args[0] ? args[0].toString().trim().toUpperCase() : '';
                if (q.startsWith('BEGIN') || q.startsWith('COMMIT') || q.startsWith('ROLLBACK') || q.startsWith('SET TRANSACTION')) {
                    return Promise.resolve();
                }
                return pool.query(...args);
            },
            release: jest.fn()
        };
    })
};

export default pool;
