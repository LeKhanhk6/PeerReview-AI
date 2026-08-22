import pool from '../config/db.js';

const sanitizeMetadata = (metadata) => {
    if (!metadata) return null;
    try {
        const str = JSON.stringify(metadata);
        if (str.length > 1000) return {};
        return metadata;
    } catch (e) {
        return {};
    }
};

export const logActivity = async ({ groupId, userId, actionType, targetId, metadata, contentSummary }) => {
    try {
        const upperActionType = actionType ? actionType.toUpperCase() : 'UNKNOWN';
        const safeTargetId = targetId ? String(targetId).slice(0, 100) : null;
        const safeMetadata = sanitizeMetadata(metadata);
        const summary = contentSummary ? String(contentSummary).substring(0, 255) : '';
        
        const result = await pool.query(`
            INSERT INTO activity_logs (group_id, user_id, action_type, target_id, metadata, content_summary)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, group_id, user_id, action_type, target_id, metadata, content_summary, created_at
        `, [groupId, userId, upperActionType, safeTargetId, safeMetadata, summary]);
        return result.rows[0];
    } catch (error) {
        console.error('Activity log failed', {
            groupId,
            userId,
            actionType,
            timestamp: new Date().toISOString(),
            error: error.message
        });
        // Do not throw error to avoid breaking the main request
        return null;
    }
};

export const getGroupActivityStats = async (groupId, options = {}) => {
    try {
        const { from, to } = options;
        
        let query = `
            SELECT user_id, action_type, COUNT(*) as total, COUNT(DISTINCT target_id) as unique_actions
            FROM activity_logs
            WHERE group_id = $1
        `;
        const params = [groupId];
        let paramIdx = 2;

        if (from) {
            query += ` AND created_at >= $${paramIdx++}`;
            params.push(from);
        }
        if (to) {
            query += ` AND created_at <= $${paramIdx++}`;
            params.push(to);
        }

        query += ` GROUP BY user_id, action_type`;

        const result = await pool.query(query, params);
        return result.rows;
    } catch (err) {
        const error = new Error('Failed to fetch activity stats');
        error.statusCode = 500;
        error.originalError = err;
        throw error;
    }
};

export const getGroupActivities = async (groupId, limit = 50, offset = 0) => {
    try {
        const result = await pool.query(`
            SELECT id, group_id, user_id, action_type, content_summary, created_at
            FROM activity_logs
            WHERE group_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [groupId, limit, offset]);
        return result.rows;
    } catch (err) {
        const error = new Error('Failed to fetch activities');
        error.statusCode = 500;
        error.originalError = err;
        throw error;
    }
};
