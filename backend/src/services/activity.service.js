import pool from '../config/db.js';

export const logActivity = async (groupId, userId, actionType, contentSummary) => {
    try {
        const summary = contentSummary ? contentSummary.substring(0, 255) : '';
        const result = await pool.query(`
            INSERT INTO activity_logs (group_id, user_id, action_type, content_summary)
            VALUES ($1, $2, $3, $4)
            RETURNING id, group_id, user_id, action_type, content_summary, created_at
        `, [groupId, userId, actionType, summary]);
        return result.rows[0];
    } catch (error) {
        console.error('Activity log failed', {
            groupId,
            userId,
            actionType,
            error: error.message
        });
        // Do not throw error to avoid breaking the main request
        return null;
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
    } catch (error) {
        throw new Error('Failed to fetch activities');
    }
};
