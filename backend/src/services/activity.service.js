import pool from '../config/db.js';
import crypto from 'crypto';
import { ACTIVITY_TYPES } from '../utils/constants.js';
import AppError from '../utils/AppError.js';

const validateId = (id, fieldName = 'ID') => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    return numericId;
};

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
        const validGroupId = validateId(groupId, 'group ID');
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
        `, [validGroupId, userId, upperActionType, safeTargetId, safeMetadata, summary]);
        return result.rows[0];
    } catch (error) {
        console.error('logActivity failed', {
            message: error.message,
            status: error.statusCode || 500,
            requestId,
            groupId,
            userId,
            actionType
        });
        // Do not throw error to avoid breaking the main request
        return null;
    }
};

export const getGroupActivityStats = async (groupId, options = {}) => {
    try {
        const validGroupId = validateId(groupId, 'group ID');
        const { from, to } = options;
        
        if (!from && !to) {
            throw new AppError("Timeframe is required", 400);
        }
        
        let query = `
            SELECT user_id, action_type, COUNT(*) as total, COUNT(DISTINCT target_id) as unique_actions
            FROM activity_logs
            WHERE group_id = $1
        `;
        const params = [validGroupId];
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
        if (!result || !Array.isArray(result.rows)) {
            return []; // Fallback on driver issue
        }
        return result.rows;
    } catch (err) {
        if (err instanceof AppError) throw err; // propagate validation errors
        console.error('getGroupActivityStats failed', { message: err.message });
        return []; // Fallback on DB crash
    }
};

export const getGroupActivities = async (groupId, limit = 50, offset = 0) => {
    try {
        const validGroupId = validateId(groupId, 'group ID');
        
        // Clamp limit between 1 and 1000
        const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 1000));
        const safeOffset = Math.max(0, Number(offset) || 0);

        // Fetch limit + 1 to determine hasNext
        const fetchLimit = safeLimit + 1;

        const result = await pool.query(`
            SELECT id, group_id, user_id, action_type, content_summary, created_at
            FROM activity_logs
            WHERE group_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [validGroupId, fetchLimit, safeOffset]);
        
        if (!result || !Array.isArray(result.rows)) {
            return []; // Fallback on driver issue
        }

        const rows = result.rows;
        let hasNext = false;
        
        if (rows.length > safeLimit) {
            hasNext = true;
            rows.pop(); // Remove the extra record
        }

        return {
            data: rows,
            hasNext
        };
    } catch (err) {
        if (err instanceof AppError) throw err;
        console.error('getGroupActivities failed', { message: err.message });
        return {
            data: [],
            hasNext: false
        }; // Fallback
    }
};
