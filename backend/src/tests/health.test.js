import { describe, it } from 'node:test';
import assert from 'node:assert';
import pool from '../config/db.js';
import { getHealthStatus } from '../controllers/health.controller.js';

describe('Health Controller - Unit Test', () => {
    it('should return 200 OK with health details when database query succeeds', async () => {
        const originalQuery = pool.query;
        pool.query = async (text) => {
            if (text === 'SELECT 1') return { rows: [{ '?column?': 1 }] };
            return originalQuery.apply(pool, [text]);
        };

        try {
            const req = {};
            let statusSent = null;
            let jsonSent = null;

            const res = {
                status: (statusCode) => {
                    statusSent = statusCode;
                    return res;
                },
                json: (data) => {
                    jsonSent = data;
                    return res;
                }
            };

            await getHealthStatus(req, res);

            assert.strictEqual(statusSent, 200);
            assert.ok(jsonSent);
            assert.ok(jsonSent.data);
            assert.strictEqual(jsonSent.data.status, 'ok');
            assert.strictEqual(jsonSent.data.database.connected, true);
            assert.strictEqual(typeof jsonSent.data.database.latencyMs, 'number');
            assert.strictEqual(typeof jsonSent.data.uptimeSeconds, 'number');
            assert.ok(jsonSent.data.memory);
        } finally {
            pool.query = originalQuery;
        }
    });

    it('should return 503 Service Unavailable when database query fails', async () => {
        const originalQuery = pool.query;
        pool.query = async () => {
            throw new Error('Connection refused');
        };

        try {
            const req = {};
            let statusSent = null;
            let jsonSent = null;

            const res = {
                status: (statusCode) => {
                    statusSent = statusCode;
                    return res;
                },
                json: (data) => {
                    jsonSent = data;
                    return res;
                }
            };

            await getHealthStatus(req, res);

            assert.strictEqual(statusSent, 503);
            assert.ok(jsonSent);
            assert.strictEqual(jsonSent.error.code, 'DATABASE_UNAVAILABLE');
            assert.strictEqual(jsonSent.data.database.connected, false);
            assert.strictEqual(jsonSent.data.database.error, 'Connection refused');
        } finally {
            pool.query = originalQuery;
        }
    });
});
