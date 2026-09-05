import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
import { ACTIVITY_TYPES } from '../constants/index.js';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

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
 * Mask all embedded email addresses inside text strings (e.g. contentSummary)
 */
const maskTextEmails = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text.replace(EMAIL_REGEX, (match) => maskEmail(match));
};

/**
 * Helper to mask email and strip credentials inside metadata JSON if present
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
  if (cleaned.target_email && typeof cleaned.target_email === 'string') {
    cleaned.target_email = maskEmail(cleaned.target_email);
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
    whereClauses.push(`r.name = $${paramIdx}`);
    queryParams.push(role.toUpperCase());
    paramIdx++;
  }

  if (status) {
    whereClauses.push(`COALESCE(u.status, 'ACTIVE') = $${paramIdx}`);
    queryParams.push(status.toUpperCase());
    paramIdx++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM users u LEFT JOIN roles r ON u.role_id = r.id ${whereSql}`,
    queryParams
  );
  const total = parseInt(countRes.rows[0].count, 10);

  // Fetch limit + 1 to check hasNext
  const fetchLimit = safeLimit + 1;
  const dataParams = [...queryParams, fetchLimit, offset];
  const dataSql = `
    SELECT u.id, u.email, u.full_name as "fullName", r.name as role, COALESCE(u.status, 'ACTIVE') as status, u.created_at as "createdAt", u.updated_at as "updatedAt"
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ${whereSql}
    ORDER BY u.created_at DESC
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
 * PATCH /api/admin/users/:userId/role (Atomic DB Transaction)
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Fetch target user with FOR UPDATE row lock
    const userRes = await client.query(
      `SELECT u.id, u.email, u.full_name, r.name as role, COALESCE(u.status, 'ACTIVE') as status 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1 FOR UPDATE OF u`,
      [targetUserId]
    );

    if (userRes.rowCount === 0) {
      throw new AppError('User not found', 404);
    }

    const targetUser = userRes.rows[0];

    // 3. Admin protection check inside transaction
    if (targetUser.role === 'ADMIN') {
      throw new AppError(
        'Forbidden: Cannot change or demote the role of an ADMIN account',
        403
      );
    }

    // 4. Fetch new role ID
    const newRoleRes = await client.query(
      'SELECT id FROM roles WHERE name = $1 LIMIT 1',
      [formattedRole]
    );
    if (newRoleRes.rows.length === 0) {
      throw new AppError('Invalid user role', 400);
    }
    const newRoleId = newRoleRes.rows[0].id;

    // Update role_id
    await client.query(
      'UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2',
      [newRoleId, targetUserId]
    );

    const updateRes = await client.query(
      `SELECT u.id, u.email, u.full_name as "fullName", r.name as role, COALESCE(u.status, 'ACTIVE') as status, u.updated_at as "updatedAt"
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [targetUserId]
    );

    // 5. Audit Log inside transaction
    await client.query(
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

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/admin/users/:userId/status (Atomic DB Transaction)
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Fetch target user with FOR UPDATE row lock
    const userRes = await client.query(
      `SELECT u.id, u.email, u.full_name, r.name as role, COALESCE(u.status, 'ACTIVE') as status 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1 FOR UPDATE OF u`,
      [targetUserId]
    );

    if (userRes.rowCount === 0) {
      throw new AppError('User not found', 404);
    }

    const targetUser = userRes.rows[0];

    // 3. Admin protection check inside transaction
    if (targetUser.role === 'ADMIN') {
      throw new AppError(
        'Forbidden: Cannot lock or disable an ADMIN account',
        403
      );
    }

    // 4. Perform actual SQL UPDATE in Postgres DB
    await client.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
      [formattedStatus, targetUserId]
    );

    const updateRes = {
      id: targetUserId,
      email: targetUser.email,
      fullName: targetUser.full_name,
      role: targetUser.role,
      status: formattedStatus,
      updatedAt: new Date().toISOString()
    };

    // 5. Audit Log inside transaction
    await client.query(
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

    await client.query('COMMIT');
    return updateRes;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * GET /api/admin/audit-logs (Read-only, camelCase normalized)
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
    SELECT al.id, al.group_id as "groupId", al.user_id as "userId", u.email as "userEmail", u.full_name as "userName",
           al.action_type as "actionType", al.target_id as "targetId", al.metadata, al.content_summary as "contentSummary", al.created_at as "createdAt"
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

  // Apply PII Masking on email, contentSummary text, and metadata
  const maskedRows = rows.map((log) => ({
    ...log,
    userEmail: maskEmail(log.userEmail),
    contentSummary: maskTextEmails(log.contentSummary),
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
 * GET /api/admin/dashboard/overview (camelCase normalized)
 */
export const getDashboardOverview = async () => {
  const [userStatsRes, activeClassesRes, submissionsRes, reviewsRes, aiRequestsRes] =
    await Promise.all([
      pool.query(
        'SELECT r.name as role, COUNT(*) as count FROM users u LEFT JOIN roles r ON u.role_id = r.id GROUP BY r.name'
      ),
      pool.query('SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL'),
      pool.query('SELECT COUNT(*) FROM submissions'),
      pool.query('SELECT COUNT(*) FROM reviews'),
      pool.query(
        "SELECT COUNT(*) FROM ai_requests WHERE created_at >= NOW() - INTERVAL '24 HOURS'"
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
