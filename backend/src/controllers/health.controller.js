import pool from '../config/db.js';

/**
 * GET /api/health
 * Public health check and diagnostics endpoint for Render/PaaS load balancers and ops monitoring.
 */
export const getHealthStatus = async (req, res) => {
    const startTime = Date.now();
    let dbConnected = false;
    let latencyMs = 0;
    let dbError = null;

    try {
        await pool.query('SELECT 1');
        latencyMs = Date.now() - startTime;
        dbConnected = true;
    } catch (err) {
        dbError = err.message;
    }

    const memoryUsage = process.memoryUsage();
    const isHealthy = dbConnected;

    const healthData = {
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
            connected: dbConnected,
            latencyMs: dbConnected ? latencyMs : null,
            ...(dbError && { error: dbError })
        },
        aiService: {
            configured: Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY)
        },
        memory: {
            heapUsedMB: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
            heapTotalMB: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
            rssMB: Number((memoryUsage.rss / 1024 / 1024).toFixed(2))
        }
    };

    if (!isHealthy) {
        return res.status(503).json({
            error: {
                code: 'DATABASE_UNAVAILABLE',
                message: 'Database connection failed',
                status: 503
            },
            data: healthData
        });
    }

    return res.status(200).json({
        data: healthData
    });
};
