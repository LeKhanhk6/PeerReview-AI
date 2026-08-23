import pool from '../config/db.js';
import { SUBMISSION_STATUS, REVIEW_STATUS } from '../utils/submission.constants.js';
import AppError from '../utils/AppError.js';
import { logActivity } from './activity.service.js';
import { ACTIVITY_TYPES } from '../utils/constants.js';

const getSubmissionStatus = (submission, deadline) => {
    if (!submission) return SUBMISSION_STATUS.NOT_STARTED;
    if (!submission.submitted_at) return SUBMISSION_STATUS.IN_PROGRESS;
    
    if (new Date(submission.submitted_at) > new Date(deadline)) {
        return SUBMISSION_STATUS.LATE;
    }
    return SUBMISSION_STATUS.SUBMITTED;
};

const getReviewStatus = (review) => {
    if (!review) return REVIEW_STATUS.NOT_REVIEWED;
    if (review.db_review_status !== 'COMPLETED') return REVIEW_STATUS.UNDER_REVIEW;
    return REVIEW_STATUS.REVIEWED;
};

const validateId = (id, fieldName = 'ID') => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    return numericId;
};

export const getStudentDashboardData = async (userId, limit, offset, sortColumn, sortOrder) => {
    try {
        console.time('dashboard_query');
        const countQuery = `
            SELECT COUNT(DISTINCT a.id) as total
            FROM assignments a
            JOIN groups g ON g.class_id = a.class_id
            JOIN group_members gm ON gm.group_id = g.id
            WHERE gm.user_id = $1
        `;
        const countResult = await pool.query(countQuery, [userId]);
        const total = parseInt(countResult.rows[0].total, 10);

        const sortedQuery = `
            WITH DashboardData AS (
                SELECT DISTINCT ON (a.id)
                    a.id as assignment_id,
                    a.title,
                    a.deadline,
                    a.created_at as assignment_created_at,
                    g.id as group_id,
                    g.name as group_name,
                    s.id as submission_id,
                    s.status as db_submission_status,
                    s.submitted_at,
                    sv.id as latest_version_id,
                    sv.created_at as version_created_at,
                    ra.is_review_completed,
                    ra.review_assignment_id
                FROM assignments a
                JOIN groups g ON g.class_id = a.class_id
                JOIN group_members gm ON gm.group_id = g.id
                LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = g.id
                LEFT JOIN LATERAL (
                    SELECT id, created_at
                    FROM submission_versions
                    WHERE submission_id = s.id
                    ORDER BY created_at DESC
                    LIMIT 1
                ) sv ON true
                LEFT JOIN (
                    SELECT 
                    submission_id, 
                    COALESCE(bool_and(status = 'COMPLETED'), false) as is_review_completed,
                    MAX(id) as review_assignment_id
                FROM review_assignments
                GROUP BY submission_id
            ) ra ON ra.submission_id = s.id
            WHERE gm.user_id = $1
            ORDER BY a.id
        )
        SELECT * FROM DashboardData
        ORDER BY ${sortColumn || 'deadline'} ${sortOrder || 'ASC'}
        LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(sortedQuery, [userId, limit, offset]);
    console.timeEnd('dashboard_query');
    const now = new Date();

        const mappedData = result.rows.map(row => {
            const deadline = new Date(row.deadline);
            
            const submission = row.submission_id ? {
                id: row.submission_id,
                submitted_at: row.submitted_at
            } : null;

            const review = row.review_assignment_id ? {
                is_completed: row.is_review_completed
            } : null;
            
            const submission_status = getSubmissionStatus(submission, deadline);
            
            // Map review status
            let review_status = REVIEW_STATUS.NOT_REVIEWED;
            if (review) {
                review_status = review.is_completed ? REVIEW_STATUS.REVIEWED : REVIEW_STATUS.UNDER_REVIEW;
            }

            const days_left = Math.max(0, Math.ceil((deadline - now) / 86400000));
            const is_overdue = deadline < now && submission_status !== SUBMISSION_STATUS.SUBMITTED;

            return {
                assignment_id: row.assignment_id,
                title: row.title,
                deadline: row.deadline,
                group_id: row.group_id,
                group_name: row.group_name,
                is_overdue,
                days_left,
                submission: submission ? {
                    id: row.submission_id,
                    status: submission_status,
                    submitted_at: row.submitted_at,
                    latest_version_id: row.latest_version_id
                } : {
                    status: submission_status
                },
                review: {
                    status: review_status
                }
            };
        });

        return {
            rows: mappedData,
            total
        };
    } catch (err) {
        const error = new AppError('Failed to fetch student dashboard data', 500);
        error.originalError = err;
        throw error;
    }
};

export const submitAssignment = async (assignmentId, userId, fileUrl) => {
    const validAssignmentId = validateId(assignmentId, 'assignment ID');
    if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim() === '') {
        throw new AppError('Valid file URL is required', 400);
    }
    
    // 1. Validation & Auth
    const authQuery = `
        SELECT a.id, a.deadline, a.title, g.id as group_id
        FROM assignments a
        JOIN groups g ON g.class_id = a.class_id
        JOIN group_members gm ON gm.group_id = g.id
        WHERE a.id = $1 AND gm.user_id = $2
    `;
    const authResult = await pool.query(authQuery, [validAssignmentId, userId]);
    
    if (authResult.rows.length === 0) {
        const checkExists = await pool.query('SELECT id FROM assignments WHERE id = $1', [validAssignmentId]);
        throw new AppError(checkExists.rows.length > 0 ? 'Forbidden access to this assignment' : 'Assignment not found', checkExists.rows.length > 0 ? 403 : 404);
    }
    
    const { deadline, title, group_id: groupId } = authResult.rows[0];
    
    // 2. Deadline Check (Unified logic)
    const now = new Date();
    const newStatus = getSubmissionStatus({ submitted_at: now }, deadline);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("SET LOCAL statement_timeout = '5s'");

        // 3. Upsert Submission with FOR UPDATE to prevent race conditions
        let submissionId;
        const subQuery = 'SELECT id FROM submissions WHERE assignment_id = $1 AND group_id = $2 FOR UPDATE';
        const subResult = await client.query(subQuery, [assignmentId, groupId]);
        
        if (subResult.rows.length === 0) {
            const insertSub = `
                INSERT INTO submissions (assignment_id, group_id, status, submitted_at)
                VALUES ($1, $2, $3, NOW())
                RETURNING id
            `;
            const insertResult = await client.query(insertSub, [assignmentId, groupId, newStatus]);
            submissionId = insertResult.rows[0].id;
        } else {
            submissionId = subResult.rows[0].id;
            const updateSub = `
                UPDATE submissions
                SET status = $1, submitted_at = NOW()
                WHERE id = $2
            `;
            await client.query(updateSub, [newStatus, submissionId]);
        }

        // 4. Max Version & Idempotency (Lock version row to prevent race condition completely)
        const versionQuery = 'SELECT version_number, file_url FROM submission_versions WHERE submission_id = $1 ORDER BY version_number DESC LIMIT 1 FOR UPDATE';
        const versionResult = await client.query(versionQuery, [submissionId]);
        
        let newVersionNumber = 1;
        if (versionResult.rows.length > 0) {
            const latest = versionResult.rows[0];
            
            // Check Idempotency: Ignore if same file_url
            if (latest.file_url === fileUrl) {
                await client.query('COMMIT');
                return {
                    submissionId,
                    versionNumber: latest.version_number,
                    status: newStatus,
                    versionData: latest
                };
            }
            
            if (latest.version_number >= 20) {
                throw new AppError('Maximum submission versions (20) exceeded.', 400);
            }
            
            newVersionNumber = latest.version_number + 1;
        }

        // 5. Insert new version
        const insertVersion = `
            INSERT INTO submission_versions (submission_id, version_number, file_url, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, version_number, file_url, created_at
        `;
        const newVersionResult = await client.query(insertVersion, [submissionId, newVersionNumber, fileUrl]);
        const versionData = newVersionResult.rows[0];

        // 6. Activity Tracking
        try {
            let actionType = ACTIVITY_TYPES.SUBMISSION_CREATED;
            if (newStatus === SUBMISSION_STATUS.LATE) actionType = ACTIVITY_TYPES.SUBMISSION_LATE;
            else if (newVersionNumber > 1) actionType = ACTIVITY_TYPES.SUBMISSION_RESUBMITTED;

            await logActivity({
                groupId, 
                userId, 
                actionType, 
                targetId: `${actionType}_${submissionId}`,
                metadata: { version: newVersionNumber, isLate: newStatus === SUBMISSION_STATUS.LATE },
                contentSummary: `Submitted assignment "${title}" (version ${newVersionNumber})`
            });
        } catch (logErr) {
            console.error('Activity log failed during submission:', logErr);
        }

        await client.query('COMMIT');
        
        return {
            submissionId,
            versionNumber: newVersionNumber,
            status: newStatus,
            versionData
        };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`submit_assignment_failed:${assignmentId}`, err);
        const status = err.status || err.statusCode || 500;
        const error = new AppError(err.message || 'Failed to submit assignment', status);
        error.originalError = err;
        throw error;
    } finally {
        client.release();
    }
};

export const getSubmissionHistoryByAssignment = async (assignmentId, userId, limit, offset) => {
    const validAssignmentId = validateId(assignmentId, 'assignment ID');
    const logTag = `submission_history:${validAssignmentId}:user:${userId}:l${limit}:o${offset}`;
    console.time(logTag);
    try {
        // 1. Validation & Auth (Fail-fast using EXISTS, optimized join level)
        const authQuery = `
            SELECT 1
            FROM assignments a
            WHERE a.id = $1
            AND EXISTS (
                SELECT 1
                FROM groups g
                JOIN group_members gm ON gm.group_id = g.id
                WHERE g.class_id = a.class_id
                AND gm.user_id = $2
            )
        `;
        const authResult = await pool.query(authQuery, [validAssignmentId, userId]);
        
        if (authResult.rows.length === 0) {
            const checkExists = await pool.query('SELECT id FROM assignments WHERE id = $1', [validAssignmentId]);
            throw new AppError(checkExists.rows.length > 0 ? 'Forbidden access to this assignment' : 'Assignment not found', checkExists.rows.length > 0 ? 403 : 404);
        }
        
        // 2. Fetch history data with Window Functions for is_latest and total count
        const historyQuery = `
            SELECT 
                sv.version_number, 
                sv.file_url, 
                sv.created_at,
                COUNT(*) OVER(PARTITION BY s.id) as total,
                CASE 
                    WHEN sv.version_number = MAX(sv.version_number) OVER (PARTITION BY s.id)
                    THEN true ELSE false
                END as is_latest
            FROM submission_versions sv
            JOIN submissions s ON sv.submission_id = s.id
            WHERE s.assignment_id = $1
            AND EXISTS (
                SELECT 1
                FROM group_members gm
                WHERE gm.group_id = s.group_id
                AND gm.user_id = $2
            )
            ORDER BY sv.version_number DESC, sv.created_at DESC
            LIMIT $3 OFFSET $4
        `;
        const historyResult = await pool.query(historyQuery, [validAssignmentId, userId, limit, offset]);
        
        if (historyResult.rows.length === 0) {
            return {
                rows: [],
                total: 0
            };
        }

        const total = parseInt(historyResult.rows[0].total, 10);
        
        // Remove the 'total' property from each row to keep the output clean
        const rows = historyResult.rows.map(row => {
            const { total, ...rest } = row;
            return rest;
        });

        return {
            rows,
            total
        };
    } catch (err) {
        console.error(`${logTag}_failed`, err);
        const status = err.status || err.statusCode || 500;
        const error = new AppError(err.message || 'Failed to get submission history', status);
        error.originalError = err;
        throw error;
    } finally {
        console.timeEnd(logTag);
    }
};

