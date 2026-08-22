import pool from '../config/db.js';
import crypto from 'crypto';
import { ACTIVITY_TYPES } from '../utils/constants.js';

const METADATA_SCHEMA = {
    [ACTIVITY_TYPES.SUBMISSION_CREATED]: ['assignmentId', 'isLate', 'version'],
    [ACTIVITY_TYPES.SUBMISSION_RESUBMITTED]: ['assignmentId', 'isLate', 'version'],
    [ACTIVITY_TYPES.SUBMISSION_LATE]: ['assignmentId', 'isLate', 'version'],
    [ACTIVITY_TYPES.REVIEW_SUBMITTED]: ['scoreGiven', 'totalCriteria']
};

const sanitizeMetadata = (actionType, metadata) => {
    if (!metadata || typeof metadata !== 'object') return null;
    try {
        const allowedKeys = METADATA_SCHEMA[actionType];
        let filteredMetadata = metadata;
        
        // Filter keys if schema exists
        if (allowedKeys) {
            filteredMetadata = {};
            for (const key of allowedKeys) {
                if (metadata[key] !== undefined) {
                    filteredMetadata[key] = metadata[key];
                }
            }
        }

        const str = JSON.stringify(filteredMetadata);
        if (str.length > 1000) {
            // Safe truncation for MVP: just clear if it still exceeds 1KB after filtering
            return {};
        }
        return filteredMetadata;
    } catch (e) {
        return {};
    }
};

export const logActivity = async ({ groupId, userId, actionType, targetId, metadata, contentSummary }) => {
    const requestId = crypto.randomUUID();
    try {
        const upperActionType = actionType ? actionType.toUpperCase() : 'UNKNOWN';
        if (!Object.values(ACTIVITY_TYPES).includes(upperActionType)) {
            console.warn(`[ActivityLog] Unknown actionType: ${upperActionType}`, { requestId });
        }

        let safeTargetId = targetId ? String(targetId).slice(0, 100) : null;
        if (safeTargetId && !safeTargetId.startsWith(upperActionType)) {
            safeTargetId = `${upperActionType}_${safeTargetId}`.slice(0, 100);
        }

        const safeMetadata = sanitizeMetadata(upperActionType, metadata);
        const summary = contentSummary ? String(contentSummary).substring(0, 255) : '';
        
        const result = await pool.query(`
            INSERT INTO activity_logs (group_id, user_id, action_type, target_id, metadata, content_summary)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, group_id, user_id, action_type, target_id, metadata, content_summary, created_at
        `, [groupId, userId, upperActionType, safeTargetId, safeMetadata, summary]);
        return result.rows[0];
    } catch (error) {
        console.error('Activity log failed', {
            requestId,
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
        
        if (!from && !to) {
            const error = new Error("Timeframe is required");
            error.statusCode = 400;
            throw error;
        }
        
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

        query += ` GROUP BY user_id, action_type ORDER BY user_id, action_type LIMIT 10000`;

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
