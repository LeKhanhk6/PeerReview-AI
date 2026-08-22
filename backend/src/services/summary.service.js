import pool from '../config/db.js';
import AppError from '../utils/AppError.js';
import { SUMMARY_STATUS, ACTIVITY_TYPES } from '../utils/constants.js';

/**
 * Common function to validate ownership of a submission
 */
const getSubmissionOrFail = async (currentUser, submissionId) => {
    const result = await pool.query(`
        SELECT sub.id as submission_id, sub.assignment_id, c.teacher_id
        FROM submissions sub
        JOIN assignments a ON sub.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE sub.id = $1
    `, [submissionId]);

    if (result.rowCount === 0) {
        throw new AppError('Submission not found', 404);
    }

    const row = result.rows[0];
    if (currentUser.role === 'ADMIN') {
        return row;
    }

    if (currentUser.role === 'TEACHER' && row.teacher_id !== currentUser.userId) {
        throw new AppError('Forbidden: You do not have access to this submission', 403);
    }

    return row;
};

export const getSourceReviews = async (currentUser, submissionId, page, limit) => {
    await getSubmissionOrFail(currentUser, submissionId);

    const offset = (page - 1) * limit;

    const result = await pool.query(`
        SELECT r.id, r.total_score, r.overall_comment, r.submitted_at, 
               ra.reviewer_group_id, ra.status
        FROM reviews r
        JOIN review_assignments ra ON r.review_assignment_id = ra.id
        WHERE ra.submission_id = $1
        ORDER BY r.submitted_at DESC NULLS LAST
        LIMIT $2 OFFSET $3
    `, [submissionId, limit, offset]);

    const countRes = await pool.query(`
        SELECT COUNT(*) 
        FROM reviews r
        JOIN review_assignments ra ON r.review_assignment_id = ra.id
        WHERE ra.submission_id = $1
    `, [submissionId]);

    return {
        reviews: result.rows,
        total: parseInt(countRes.rows[0].count, 10),
        page,
        limit
    };
};

export const getReviewSummary = async (currentUser, submissionId) => {
    await getSubmissionOrFail(currentUser, submissionId);

    const summaryRes = await pool.query(`
        SELECT id, submission_id, status, updated_by, updated_at, generated_at
        FROM review_summaries
        WHERE submission_id = $1
    `, [submissionId]);

    if (summaryRes.rowCount === 0) {
        throw new AppError('Summary not generated yet', 404);
    }

    const summary = summaryRes.rows[0];

    const itemsRes = await pool.query(`
        SELECT id, topic_category, content, frequency_count, is_teacher_edited, 
               source_review_ids, created_at, updated_at
        FROM review_summary_items
        WHERE summary_id = $1
        ORDER BY created_at ASC
    `, [summary.id]);

    const countRes = await pool.query(`
        SELECT COUNT(*) 
        FROM reviews r
        JOIN review_assignments ra ON r.review_assignment_id = ra.id
        WHERE ra.submission_id = $1
    `, [submissionId]);

    return {
        summary: {
            id: summary.id,
            status: summary.status,
            updatedBy: summary.updated_by,
            updatedAt: summary.updated_at,
            generatedAt: summary.generated_at
        },
        items: itemsRes.rows,
        sourceReviewsCount: parseInt(countRes.rows[0].count, 10)
    };
};

export const updateSummaryItem = async (currentUser, itemId, updates) => {
    // Fail-fast ownership check and not found check via item id
    const itemRes = await pool.query(`
        SELECT i.id, i.updated_at, s.id as summary_id, s.status, c.teacher_id, s.submission_id
        FROM review_summary_items i
        JOIN review_summaries s ON i.summary_id = s.id
        JOIN submissions sub ON s.submission_id = sub.id
        JOIN assignments a ON sub.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE i.id = $1
    `, [itemId]);

    if (itemRes.rowCount === 0) {
        throw new AppError('Summary item not found', 404);
    }

    const item = itemRes.rows[0];
    if (currentUser.role === 'TEACHER' && item.teacher_id !== currentUser.userId) {
        throw new AppError('Forbidden: You do not have access to this summary', 403);
    }

    if (item.status === SUMMARY_STATUS.APPROVED) {
        throw new AppError('Cannot edit an approved summary', 400);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Note: optimistic locking omitted in MVP if not explicitly provided by client payload, 
        // but adding it since it was mentioned in plan
        const { content, note, updatedAt } = updates;

        const updateItemRes = await client.query(`
            UPDATE review_summary_items
            SET content = COALESCE($1, content),
                note = COALESCE($2, note),
                is_teacher_edited = true,
                updated_at = NOW()
            WHERE id = $3 AND updated_at = $4
            RETURNING updated_at
        `, [content, note, itemId, updatedAt]);

        if (updateItemRes.rowCount === 0) {
            throw new AppError('Failed to update item, it might have been modified by someone else or deleted (Conflict)', 409);
        }
        
        // Update status to REVIEWING if it was DRAFT
        if (item.status === SUMMARY_STATUS.DRAFT) {
            const updateStatusRes = await client.query(`
                UPDATE review_summaries
                SET status = $1, updated_by = $2, updated_at = NOW()
                WHERE id = $3 AND status = $4
            `, [SUMMARY_STATUS.REVIEWING, currentUser.userId, item.summary_id, SUMMARY_STATUS.DRAFT]);
            if (updateStatusRes.rowCount === 0) {
                console.warn(`Summary ${item.summary_id} status was already updated to REVIEWING or another state`);
            }
        }

        // Insert into activity logs
        await client.query(`
            INSERT INTO activity_logs (group_id, user_id, action_type, target_id, metadata, content_summary)
            VALUES (NULL, $1, $2, $3, $4, $5)
        `, [
            currentUser.userId, 
            ACTIVITY_TYPES.EDIT_SUMMARY, 
            itemId, 
            JSON.stringify({ submission_id: item.submission_id, item_id: itemId }),
            'Teacher edited summary item'
        ]);

        await client.query('COMMIT');
        
        return {
            id: itemId,
            updatedAt: updateItemRes.rows[0].updated_at
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const approveReviewSummary = async (currentUser, submissionId) => {
    await getSubmissionOrFail(currentUser, submissionId);

    const client = await pool.connect();
    try {
        await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');

        // Check summary existence and lock row
        const summaryRes = await client.query(`
            SELECT * FROM review_summaries
            WHERE submission_id = $1
            FOR UPDATE NOWAIT
        `, [submissionId]);

        if (summaryRes.rowCount === 0) {
            throw new AppError('Summary not generated yet', 404);
        }

        const summary = summaryRes.rows[0];

        if (summary.status === SUMMARY_STATUS.APPROVED) {
            throw new AppError('Summary is already approved', 400);
        }

        // Check if has items
        const countRes = await client.query(`
            SELECT COUNT(*) FROM review_summary_items WHERE summary_id = $1
        `, [summary.id]);

        if (parseInt(countRes.rows[0].count, 10) === 0) {
            throw new AppError('Cannot approve empty summary', 400);
        }

        const updateRes = await client.query(`
            UPDATE review_summaries
            SET status = $1, updated_by = $2, updated_at = NOW()
            WHERE id = $3 AND status != $1
            RETURNING updated_at
        `, [SUMMARY_STATUS.APPROVED, currentUser.userId, summary.id]);
        
        if (updateRes.rowCount === 0) {
            throw new AppError('Summary is already approved or could not be updated', 400);
        }

        // Insert into activity logs
        await client.query(`
            INSERT INTO activity_logs (group_id, user_id, action_type, target_id, metadata, content_summary)
            VALUES (NULL, $1, $2, $3, $4, $5)
        `, [
            currentUser.userId, 
            ACTIVITY_TYPES.APPROVE_SUMMARY, 
            summary.id, 
            JSON.stringify({ submission_id: submissionId, summary_id: summary.id }),
            'Teacher approved review summary'
        ]);

        await client.query('COMMIT');
        
        return {
            id: summary.id,
            status: SUMMARY_STATUS.APPROVED,
            updatedAt: updateRes.rows[0].updated_at
        };
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '55P03') {
            throw new AppError('The summary is currently being updated by another teacher. Please try again.', 409);
        }
        throw error;
    } finally {
        client.release();
    }
};
