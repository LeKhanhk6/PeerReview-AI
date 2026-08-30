import pool from '../config/db.js';
import { getSystemConfigValue } from '../services/system-config.service.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';

// In-memory sliding window rate limiter per user/IP
const userRequestTimestamps = new Map();

/**
 * Idempotent DB Initialization for ai_requests table
 */
export const initAiRequestsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_requests (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        request_type VARCHAR(50) NOT NULL,
        prompt_hash VARCHAR(64),
        prompt_tokens INT DEFAULT 0,
        candidates_tokens INT DEFAULT 0,
        total_tokens INT DEFAULT 0,
        cost_estimate NUMERIC(10, 6) DEFAULT 0,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_req_created_at ON ai_requests(created_at);
    `);
  } catch (err) {
    logger.error('Failed to initialize ai_requests table:', err);
  }
};

/**
 * Log AI Request usage & token metrics to DB
 */
export const logAiRequestMetric = async ({
  userId,
  requestType = 'AI_MENTOR',
  promptHash = null,
  promptTokens = 0,
  candidatesTokens = 0,
  totalTokens = 0,
  status = 'success',
}) => {
  await initAiRequestsTable();

  // Gemini 1.5/3.6 Flash price per 1,000 tokens ($0.00015 / 1k tokens)
  const PRICE_PER_1K_TOKENS = 0.00015;
  const costEstimate = status === 'cache_hit' ? 0 : (totalTokens / 1000) * PRICE_PER_1K_TOKENS;

  try {
    await pool.query(
      `INSERT INTO ai_requests (user_id, request_type, prompt_hash, prompt_tokens, candidates_tokens, total_tokens, cost_estimate, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId || null, requestType, promptHash, promptTokens, candidatesTokens, totalTokens, costEstimate, status]
    );
  } catch (err) {
    logger.error('Failed to log ai_requests metric:', err);
  }
};

/**
 * Dynamic AI Mentor Rate Limiter Middleware
 * Reads getSystemConfigValue('rate_limit_ai_mentor') dynamically at runtime.
 */
export const dynamicAiRateLimiter = async (req, res, next) => {
  try {
    // 1. Read rate limit config dynamically (reflects PATCH immediately via instant cache invalidation)
    const configValStr = await getSystemConfigValue('rate_limit_ai_mentor');
    let maxRequestsPerMinute = parseInt(configValStr, 10);
    if (isNaN(maxRequestsPerMinute) || maxRequestsPerMinute <= 0) {
      maxRequestsPerMinute = 30; // Default fallback
    }

    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    if (!userRequestTimestamps.has(key)) {
      userRequestTimestamps.set(key, []);
    }

    const timestamps = userRequestTimestamps.get(key);
    // Filter timestamps within the 1-minute window
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= maxRequestsPerMinute) {
      // Log rate limited request
      logAiRequestMetric({
        userId: req.user?.id,
        requestType: 'AI_MENTOR',
        status: 'rate_limited',
      });

      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: `Bạn đã vượt quá giới hạn lượt sử dụng AI Mentor (tối đa ${maxRequestsPerMinute} lượt/phút). Vui lòng thử lại sau.`,
        },
      });
    }

    validTimestamps.push(now);
    userRequestTimestamps.set(key, validTimestamps);
    next();
  } catch (error) {
    next(error);
  }
};
