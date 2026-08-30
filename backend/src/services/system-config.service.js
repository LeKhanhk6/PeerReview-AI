import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
import { ACTIVITY_TYPES } from '../constants/index.js';

// In-memory TTL Cache for fast runtime queries (Zero DB Latency)
// Note: In-memory TTL cache (60s). Multi-instance consistency guaranteed via 60s TTL expiration.
const configCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Whitelist and Semantic Validation Rules
const CONFIG_WHITELIST = {
  audit_logging_enabled: {
    validate: (val) => val === 'true' || val === 'false',
    errorMsg: 'audit_logging_enabled must be "true" or "false"',
  },
  telemetry_enabled: {
    validate: (val) => val === 'true' || val === 'false',
    errorMsg: 'telemetry_enabled must be "true" or "false"',
  },
  rate_limit_ai_mentor: {
    validate: (val) => /^[1-9]\d*$/.test(String(val)),
    errorMsg: 'rate_limit_ai_mentor must be a positive integer > 0',
  },
  pii_sanitization_mode: {
    validate: (val) => val === 'STRICT' || val === 'RELAXED',
    errorMsg: 'pii_sanitization_mode must be "STRICT" or "RELAXED"',
  },
};

/**
 * Idempotent Database Migration & Seed
 * Ensures system_config table exists and is populated without overwriting existing admin edits on server restart.
 */
export const initSystemConfigTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        updated_by VARCHAR(100),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Seed default rows ON CONFLICT (key) DO NOTHING (Idempotent: preserves admin edits)
    await pool.query(`
      INSERT INTO system_config (key, value, description, updated_by)
      VALUES 
        ('audit_logging_enabled', 'true', 'Tự động ghi vết mọi thao tác nhạy cảm vào activity_logs', 'SYSTEM'),
        ('telemetry_enabled', 'true', 'Thu thập lỗi runtime và báo cáo sự cố mạng (/api/client-errors)', 'SYSTEM'),
        ('rate_limit_ai_mentor', '30', 'Giới hạn số request AI Mentor mỗi phút per sinh viên', 'SYSTEM'),
        ('pii_sanitization_mode', 'STRICT', 'Chế độ mã hóa PII thông tin sinh viên và người chấm', 'SYSTEM')
      ON CONFLICT (key) DO NOTHING;
    `);

    logger.info('System config table initialized and seeded successfully.');
  } catch (err) {
    logger.error('Failed to initialize system_config table:', err);
  }
};

/**
 * Helper to read runtime config value with In-Memory Cache (60s TTL)
 */
export const getSystemConfigValue = async (key, defaultValue = null) => {
  const now = Date.now();
  const cached = configCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const res = await pool.query('SELECT value FROM system_config WHERE key = $1', [key]);
    if (res.rowCount > 0) {
      const val = res.rows[0].value;
      configCache.set(key, { value: val, expiresAt: now + CACHE_TTL_MS });
      return val;
    }
  } catch (err) {
    logger.error(`Failed to fetch system_config key "${key}":`, err);
  }

  return defaultValue;
};

/**
 * GET /api/admin/system-config
 */
export const getSystemConfigs = async () => {
  // Ensure table initialized
  await initSystemConfigTable();

  const res = await pool.query(
    'SELECT key, value, description, updated_by as "updatedBy", updated_at as "updatedAt" FROM system_config ORDER BY id ASC'
  );

  // Return key-value object and array list
  const configMap = {};
  res.rows.forEach((row) => {
    configMap[row.key] = row.value;
  });

  return {
    configs: configMap,
    items: res.rows,
  };
};

/**
 * PATCH /api/admin/system-config (Multi-key Batch Update inside 1 DB Transaction)
 */
export const updateSystemConfigs = async (currentUser, payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).length === 0) {
    throw new AppError('Payload must be a non-empty object containing config key-value pairs', 400);
  }

  const entries = Object.entries(payload);

  // 1. Whitelist & Semantic Validation
  for (const [key, val] of entries) {
    const rule = CONFIG_WHITELIST[key];
    if (!rule) {
      throw new AppError(`Invalid system config key "${key}". Key is not in allowed whitelist.`, 400);
    }
    const valStr = String(val ?? '').trim();
    if (!rule.validate(valStr)) {
      throw new AppError(`Invalid value for "${key}": ${rule.errorMsg}`, 400);
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const changes = [];

    for (const [key, val] of entries) {
      const valStr = String(val).trim();

      // Fetch old value
      const oldRes = await client.query('SELECT value FROM system_config WHERE key = $1 FOR UPDATE', [key]);
      const oldVal = oldRes.rowCount > 0 ? oldRes.rows[0].value : null;

      // Update in DB
      await client.query(
        `UPDATE system_config 
         SET value = $1, updated_by = $2, updated_at = NOW() 
         WHERE key = $3`,
        [valStr, currentUser.email || currentUser.userId, key]
      );

      // Instant Cache Invalidation
      configCache.delete(key);

      changes.push({
        key,
        old_value: oldVal,
        new_value: valStr,
      });
    }

    // Single unified Audit Log entry for the entire batch
    await client.query(
      `INSERT INTO activity_logs (group_id, user_id, action_type, target_id, metadata, content_summary)
       VALUES (NULL, $1, $2, $3, $4, $5)`,
      [
        currentUser.userId,
        ACTIVITY_TYPES.ADMIN_UPDATE_SYS_CONFIG || 'ADMIN_UPDATE_SYS_CONFIG',
        'SYSTEM_CONFIG',
        JSON.stringify({ changes }),
        `Admin updated system config (${changes.map((c) => c.key).join(', ')})`,
      ]
    );

    await client.query('COMMIT');

    // Return latest config state
    const latest = await getSystemConfigs();
    return latest;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
