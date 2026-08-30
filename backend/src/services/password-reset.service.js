import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
import { sendPasswordResetEmail } from './email.service.js';

/**
 * Idempotent Database Initialization for Password Reset Tables
 */
export const initPasswordResetTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON password_reset_tokens(token_hash);
    `);
  } catch (err) {
    logger.error('Failed to initialize password_reset_tokens table:', err);
  }
};

/**
 * Hash raw token with SHA-256 (Never store raw token in DB)
 */
const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Request Password Reset (Anti-enumeration: Uniform response for all inputs)
 */
export const requestPasswordReset = async (email) => {
  await initPasswordResetTables();

  const formattedEmail = String(email || '').trim().toLowerCase();
  const UNIFORM_RESPONSE_MESSAGE =
    'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.';

  if (!formattedEmail) {
    return { message: UNIFORM_RESPONSE_MESSAGE };
  }

  try {
    // 1. Fetch user by email
    const userRes = await pool.query('SELECT id, email, full_name FROM users WHERE email = $1', [
      formattedEmail,
    ]);

    if (userRes.rowCount === 0) {
      // Anti-enumeration protection: return uniform response even if email does not exist
      return { message: UNIFORM_RESPONSE_MESSAGE };
    }

    const user = userRes.rows[0];

    // 2. Generate random 32-byte raw token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    // 3. Insert SHA-256 token hash into DB with 15-min expiration
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 MINUTES')`,
      [user.id, tokenHash]
    );

    // 4. Send email with rawToken (Fire-and-forget)
    sendPasswordResetEmail(user.email, rawToken).catch((err) => {
      logger.error('Background email error:', err);
    });
  } catch (error) {
    logger.error('Error in requestPasswordReset:', error);
  }

  return { message: UNIFORM_RESPONSE_MESSAGE };
};

/**
 * Reset Password (Verifies 15-min SHA-256 token, hashes new password, invalidates token)
 */
export const resetPassword = async (rawToken, newPassword) => {
  await initPasswordResetTables();

  if (!rawToken || typeof rawToken !== 'string') {
    throw new AppError('Token không hợp lệ hoặc đã hết hạn', 400);
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự', 400);
  }

  const tokenHash = hashToken(rawToken.trim());

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Query token with FOR UPDATE lock
    const tokenRes = await client.query(
      `SELECT id, user_id, expires_at, used_at 
       FROM password_reset_tokens 
       WHERE token_hash = $1 FOR UPDATE`,
      [tokenHash]
    );

    if (tokenRes.rowCount === 0) {
      throw new AppError('Token không hợp lệ hoặc đã hết hạn (chỉ có hiệu lực 15 phút)', 400);
    }

    const tokenRow = tokenRes.rows[0];

    // 2. Check if token already used
    if (tokenRow.used_at) {
      throw new AppError('Token này đã được sử dụng trước đó (chỉ cho phép sử dụng 1 lần)', 400);
    }

    // 3. Check expiration
    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      throw new AppError('Token đã hết hạn (chỉ có hiệu lực trong vòng 15 phút)', 400);
    }

    // 4. Hash new password with bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 5. Update user password
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, tokenRow.user_id]
    );

    // 6. Mark token as used (One-time token enforcement)
    await client.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [tokenRow.id]
    );

    // 7. Audit log
    await client.query(
      `INSERT INTO activity_logs (group_id, user_id, action_type, target_id, metadata, content_summary)
       VALUES (NULL, $1, $2, $3, $4, $5)`,
      [
        tokenRow.user_id,
        'PASSWORD_RESET',
        tokenRow.user_id,
        JSON.stringify({ reset_at: new Date().toISOString() }),
        'User successfully reset their password via token',
      ]
    );

    await client.query('COMMIT');
    return { success: true, message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
