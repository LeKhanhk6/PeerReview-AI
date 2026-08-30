import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
import { ACTIVITY_TYPES } from '../constants/index.js';

/**
 * Mask email address for backend PII safety: user@domain.com -> u***@domain.com
 */
const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
};

/**
 * Helper to mask email inside metadata JSON if present
 */
const maskMetadataPii = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return metadata;
  const cleaned = { ...metadata };

  // Strip sensitive credential keys
  const sensitiveKeys = ['password', 'token', 'secret', 'jwt', 'api_key', 'authorization'];
  for (const key of sensitiveKeys) {
    if (key in cleaned) {
      delete cleaned[key];
    }
  }

  // Mask email if present
  if (cleaned.email && typeof cleaned.email === 'string') {
    cleaned.email = maskEmail(cleaned.email);
  }

  return cleaned;
};

/**
 * GET /api/admin/users
 */
export const getUsers = async (options = {}) => {
  const { page = 1, limit = 20, search, role, status } = options;

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
  const offset = (safePage - 1) * safeLimit;

  let whereClauses = [];
  let queryParams = [];
  let paramIdx = 1;

  if (search) {
    whereClauses.push(`(full_name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
    queryParams.push(`%${search.trim()}%`);
    paramIdx++;
  }

  if (role) {
    whereClauses.push(`role = $${paramIdx}`);
    queryParams.push(role.toUpperCase());
    paramIdx++;
  }

  if (status) {
    whereClauses.push(`status = $${paramIdx}`);
    queryParams.push(status.toUpperCase());
    paramIdx++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM users ${whereSql}`,
    queryParams
  );
  const total = parseInt(countRes.rows[0].count, 10);

  // Fetch limit + 1 to check hasNext
  const fetchLimit = safeLimit + 1;
  const dataParams = [...queryParams, fetchLimit, offset];
  const dataSql = `
    SELECT id, email, full_name, role, status, created_at, updated_at
    FROM users
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  const dataRes = await pool.query(dataSql, dataParams);
  let rows = dataRes.rows;

  let hasNext = false;
  if (rows.length > safeLimit) {
    hasNext = true;
    rows.pop();
  }

  return {
    users: rows,
    total,
    page: safePage,
    limit: safeLimit,
    hasNext,
  };
};

/**
 * PATCH /api/admin/users/:userId/role
 */
export const updateUserRole = async (currentUser, targetUserId, newRole) => {
  const validRoles = ['STUDENT', 'TEACHER', 'ADMIN'];
  const formattedRole = String(newRole || '').toUpperCase();

  if (!validRoles.includes(formattedRole)) {
    throw new AppError('Invalid user role', 400);
  }

  // 1. Self-protection check
  if (String(currentUser.userId) === String(targetUserId)) {
    throw new AppError('Forbidden: ADMIN cannot demote or change their own role', 403);
  }

  // 2. Fetch target user
  const userRes = await pool.query(
    'SELECT id, email, full_name, role, status FROM users WHERE id = $1',
    [targetUserId]
  );

  if (userRes.rowCount === 0) {
    throw new AppError('User not found', 404);
  }

  const targetUser = userRes.rows[0];

  // 3. Last-Admin protection check
  if (targetUser.role === 'ADMIN' && formattedRole !== 'ADMIN') {
    const adminCountRes = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'"
    );
    const activeAdminCount = parseInt(adminCountRes.rows[0].count, 10);

    if (activeAdminCount <= 1) {
      throw new AppError(
        'Conflict: Cannot demote the last remaining active ADMIN in the system',
        409
      );
    }
  }

  // 4. Update role
  const updateRes = await pool.query(
    'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, full_name, role, status, updated_at',
    [formattedRole, targetUserId]
  );

  // 5. Audit Log
  try {
    await pool.query(
      `INSERT INTO activity_logs (group_id, user_id, action_type, target_id, metadata, content_summary)
       VALUES (NULL, $1, $2, $3, $4, $5)`,
      [
        currentUser.userId,
        ACTIVITY_TYPES.ADMIN_UPDATE_ROLE || 'ADMIN_UPDATE_ROLE',
        targetUserId,
        JSON.stringify({ old_role: targetUser.role, new_role: formattedRole, target_email: maskEmail(targetUser.email) }),
        `Admin updated user ${targetUser.email} role to ${formattedRole}`,
      ]
    );
  } catch (logErr) {
    logger.error('Failed to write audit log for updateUserRole:', logErr);
  }

  return updateRes.rows[0];
};

/**
 * PATCH /api/admin/users/:userId/status
 */
export const updateUserStatus = async (currentUser, targetUserId, newStatus) => {
  const validStatuses = ['ACTIVE', 'INACTIVE', 'LOCKED'];
  const formattedStatus = String(newStatus || '').toUpperCase();

  if (!validStatuses.includes(formattedStatus)) {
    throw new AppError('Invalid user status', 400);
  }

  // 1. Self-protection check
  if (String(currentUser.userId) === String(targetUserId)) {
    throw new AppError('Forbidden: ADMIN cannot lock or disable their own account', 403);
  }

  // 2. Fetch target user
  const userRes = await pool.query(
    'SELECT id, email, full_name, role, status FROM users WHERE id = $1',
    [targetUserId]
  );

  if (userRes.rowCount === 0) {
    throw new AppError('User not found', 404);
  }

  const targetUser = userRes.rows[0];

  // 3. Last-Admin protection check
  if (targetUser.role === 'ADMIN' && formattedStatus !== 'ACTIVE') {
    const adminCountRes = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'"
    );
    const activeAdminCount = parseInt(adminCountRes.rows[0].count, 10);

    if (activeAdminCount <= 1) {
      throw new AppError(
        'Conflict: Cannot lock or disable the last remaining active ADMIN in the system',
        409
      );
    }
  }

  // 4. Update status
  const updateRes = await pool.query(
    'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, full_name, role, status, updated_at',
    [formattedStatus, targetUserId]
  );

  // 5. Audit Log
  try {
    await pool.query(
      `INSERT INTO activity_logs (group_id, user_id, action_type, target_id, metadata, content_summary)
       VALUES (NULL, $1, $2, $3, $4, $5)`,
      [
        currentUser.userId,
        ACTIVITY_TYPES.ADMIN_UPDATE_STATUS || 'ADMIN_UPDATE_STATUS',
        targetUserId,
        JSON.stringify({ old_status: targetUser.status, new_status: formattedStatus, target_email: maskEmail(targetUser.email) }),
        `Admin updated user ${targetUser.email} status to ${formattedStatus}`,
      ]
    );
  } catch (logErr) {
    logger.error('Failed to write audit log for updateUserStatus:', logErr);
  }

  return updateRes.rows[0];
};

/**
 * GET /api/admin/audit-logs (Read-only)
 */
export const getAuditLogs = async (options = {}) => {
  const { page = 1, limit = 20, action_type, user_id, from, to } = options;

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
  const offset = (safePage - 1) * safeLimit;

  let whereClauses = [];
  let queryParams = [];
  let paramIdx = 1;

  if (action_type) {
    whereClauses.push(`al.action_type = $${paramIdx}`);
    queryParams.push(action_type.toUpperCase());
    paramIdx++;
  }

  if (user_id) {
    whereClauses.push(`al.user_id = $${paramIdx}`);
    queryParams.push(user_id);
    paramIdx++;
  }

  if (from) {
    whereClauses.push(`al.created_at >= $${paramIdx}`);
    queryParams.push(from);
    paramIdx++;
  }

  if (to) {
    whereClauses.push(`al.created_at <= $${paramIdx}`);
    queryParams.push(to);
    paramIdx++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM activity_logs al ${whereSql}`,
    queryParams
  );
  const total = parseInt(countRes.rows[0].count, 10);

  // Fetch limit + 1 to check hasNext
  const fetchLimit = safeLimit + 1;
  const dataParams = [...queryParams, fetchLimit, offset];
  const dataSql = `
    SELECT al.id, al.group_id, al.user_id, u.email as user_email, u.full_name as user_name,
           al.action_type, al.target_id, al.metadata, al.content_summary, al.created_at
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereSql}
    ORDER BY al.created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  const dataRes = await pool.query(dataSql, dataParams);
  let rows = dataRes.rows;

  let hasNext = false;
  if (rows.length > safeLimit) {
    hasNext = true;
    rows.pop();
  }

  // Apply PII Masking on email and metadata
  const maskedRows = rows.map((log) => ({
    ...log,
    user_email: maskEmail(log.user_email),
    metadata: maskMetadataPii(log.metadata),
  }));

  return {
    logs: maskedRows,
    total,
    page: safePage,
    limit: safeLimit,
    hasNext,
  };
};

/**
 * GET /api/admin/dashboard/overview
 */
export const getDashboardOverview = async () => {
  const [userStatsRes, activeClassesRes, submissionsRes, reviewsRes, aiRequestsRes] =
    await Promise.all([
      pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
      pool.query("SELECT COUNT(*) FROM classes WHERE status = 'ACTIVE'"),
      pool.query('SELECT COUNT(*) FROM submissions'),
      pool.query('SELECT COUNT(*) FROM reviews'),
      pool.query(
        "SELECT COUNT(*) FROM activity_logs WHERE action_type ILIKE '%AI%' AND created_at >= NOW() - INTERVAL '24 HOURS'"
      ),
    ]);

  const userCounts = {
    STUDENT: 0,
    TEACHER: 0,
    ADMIN: 0,
    TOTAL: 0,
  };

  userStatsRes.rows.forEach((row) => {
    const roleKey = String(row.role || '').toUpperCase();
    const countNum = parseInt(row.count, 10) || 0;
    if (roleKey in userCounts) {
      userCounts[roleKey] = countNum;
    }
    userCounts.TOTAL += countNum;
  });

  return {
    users: userCounts,
    activeClasses: parseInt(activeClassesRes.rows[0]?.count, 10) || 0,
    totalSubmissions: parseInt(submissionsRes.rows[0]?.count, 10) || 0,
    totalReviews: parseInt(reviewsRes.rows[0]?.count, 10) || 0,
    aiRequests24h: parseInt(aiRequestsRes.rows[0]?.count, 10) || 0,
  };
};
