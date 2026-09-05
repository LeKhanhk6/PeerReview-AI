import pool from '../config/db.js';
import crypto from 'crypto';
import { ACTIVITY_TYPES } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const validateId = (id, fieldName = 'ID') => {
    if (id === null || id === undefined) {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    if (typeof id === 'string') {
        const trimmed = id.trim();
        if (UUID_REGEX.test(trimmed)) {
            return trimmed;
        }
        const numericId = Number(trimmed);
        if (Number.isInteger(numericId) && numericId > 0) {
            return numericId;
        }
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
        return numericId;
    }
    throw new AppError(`Invalid ${fieldName}`, 400);
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
            return {
                truncated: true,
                preview: str.slice(0, 500)
            };
        }
        return filteredMetadata;
    } catch (e) {
        return { invalid: true };
    }
};

export const logActivity = async ({ groupId, userId, actionType, targetId, metadata, contentSummary, requestId }) => {
    const startTime = Date.now();
    try {
        const validGroupId = validateId(groupId, 'group ID');
        const upperActionType = actionType ? actionType.toUpperCase() : 'UNKNOWN';
        if (!Object.values(ACTIVITY_TYPES).includes(upperActionType)) {
            logger.warn({
                event: 'activity.unknown_action_type',
                actionType: upperActionType,
                requestId
            });
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
        logger.error({
            event: 'activity.log.failed',
            service: 'activity.service',
            userId,
            requestId,
            message: error.message,
            stack: error.stack,
            durationMs: Date.now() - startTime,
            actionType,
            groupId,
            targetId
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
        
        let baseQuery = `
            SELECT user_id, action_type, target_id, created_at
            FROM activity_logs
            WHERE group_id = $1
            UNION ALL
            SELECT user_id, 'DISCUSSION_POST' as action_type, 'DISCUSSION_POST_' || id as target_id, created_at
            FROM group_discussions
            WHERE group_id = $1
        `;

        let query = `
            SELECT user_id, action_type, COUNT(*) as total, COUNT(DISTINCT target_id) as unique_actions
            FROM (${baseQuery}) as combined_logs
            WHERE 1=1
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
        logger.error({ event: 'activity.stats.failed', service: 'activity.service', error: err.message });
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
            SELECT a.id, a.group_id, a.user_id, u.full_name as user_name, r.name as user_role, a.action_type, a.content_summary, a.created_at
            FROM activity_logs a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE a.group_id = $1
            ORDER BY a.created_at DESC
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
        logger.error({ event: 'activity.list.failed', service: 'activity.service', error: err.message });
        return {
            data: [],
            hasNext: false
        }; // Fallback
    }
};
