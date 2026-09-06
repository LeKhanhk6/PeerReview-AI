import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { SUMMARY_STATUS, ACTIVITY_TYPES } from '../constants/index.js';
import logger from '../utils/logger.util.js';
import { mapDbError } from '../utils/dbError.util.js';
import { withTransaction } from '../utils/db.util.js';
import { synthesizeReviews } from './ai.service.js';
import crypto from 'crypto';

// In-memory lock for preventing concurrent generation per submission
const generationLocks = new Set();


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

/**
 * Common function to validate ownership of a submission
 */
const getSubmissionOrFail = async (currentUser, submissionId) => {
    const validSubmissionId = validateId(submissionId, 'submission ID');
    const result = await pool.query(`
        SELECT sub.id as submission_id, sub.assignment_id, c.teacher_id
        FROM submissions sub
        JOIN assignments a ON sub.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE sub.id = $1
    `, [validSubmissionId]);

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

export const getSourceReviews = async (currentUser, submissionId) => {
    const targetSubmission = await getSubmissionOrFail(currentUser, submissionId);

    const result = await pool.query(`
        SELECT r.id, r.total_score, r.overall_comment, r.submitted_at, 
               ra.reviewer_group_id, ra.status
        FROM reviews r
        JOIN review_assignments ra ON r.review_assignment_id = ra.id
        WHERE ra.submission_id = $1
        ORDER BY r.submitted_at DESC NULLS LAST
    `, [targetSubmission.submission_id]);

    const countRes = await pool.query(`
        SELECT COUNT(*) 
        FROM reviews r
        JOIN review_assignments ra ON r.review_assignment_id = ra.id
        WHERE ra.submission_id = $1
    `, [targetSubmission.submission_id]);

    return {
        reviews: result.rows,
        total: parseInt(countRes.rows[0].count, 10),
    };
};

export const getReviewSummary = async (currentUser, submissionId) => {
    const targetSubmission = await getSubmissionOrFail(currentUser, submissionId);

    const summaryRes = await pool.query(`
        SELECT id, submission_id, status, updated_by, updated_at, generated_at
        FROM review_summaries
        WHERE submission_id = $1
    `, [targetSubmission.submission_id]);

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
    `, [targetSubmission.submission_id]);

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
    const validItemId = validateId(itemId, 'item ID');
    // Fail-fast ownership check and not found check via item id
    const itemRes = await pool.query(`
        SELECT i.id, i.updated_at, s.id as summary_id, s.status, c.teacher_id, s.submission_id
        FROM review_summary_items i
        JOIN review_summaries s ON i.summary_id = s.id
        JOIN submissions sub ON s.submission_id = sub.id
        JOIN assignments a ON sub.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE i.id = $1
    `, [validItemId]);

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

    return withTransaction(async (client) => {
        // Note: optimistic locking omitted in MVP if not explicitly provided by client payload, 
        // but adding it since it was mentioned in plan
        const { content, note, updatedAt } = updates;

        const updateItemRes = await client.query(`
            UPDATE review_summary_items
            SET content = COALESCE($1, content),
                note = COALESCE($2, note),
                is_teacher_edited = true,
                updated_at = NOW()
            WHERE id = $3 AND ($4::timestamp IS NULL OR updated_at <= $4::timestamp + INTERVAL '1 second')
            RETURNING updated_at
        `, [content, note, validItemId, updatedAt || null]);

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
                logger.warn({
                    event: 'summary_item_status_ignored',
                    summaryId: item.summary_id,
                    message: `Summary ${item.summary_id} status was already updated to REVIEWING or another state`
                });
            }
        }

        // Insert into activity logs removed as per user request

        return {
            id: validItemId,
            updatedAt: updateItemRes.rows[0].updated_at
        };
    }, 'REPEATABLE READ').catch(error => {
        if (error.isOperational || (error.status >= 400 && error.status < 600)) throw error;
        throw mapDbError(error, error.code === '55P03' ? 'The summary is currently being updated by another teacher. Please try again.' : null);
    });
};

export const deleteSummaryItem = async (currentUser, itemId) => {
    const validItemId = parseUUID(itemId, 'Item ID');

    const itemRes = await pool.query(`
        SELECT rsi.*, rs.status, rs.submission_id, a.class_id, tc.teacher_id
        FROM review_summary_items rsi
        JOIN review_summaries rs ON rsi.summary_id = rs.id
        JOIN submissions s ON rs.submission_id = s.id
        JOIN assignments a ON s.assignment_id = a.id
        LEFT JOIN teacher_classes tc ON a.class_id = tc.class_id AND tc.teacher_id = $1
        WHERE rsi.id = $2
    `, [currentUser.userId, validItemId]);

    if (itemRes.rowCount === 0) {
        throw new AppError('Summary item not found', 404);
    }

    const item = itemRes.rows[0];
    if (currentUser.role === 'TEACHER' && item.teacher_id !== currentUser.userId) {
        throw new AppError('Forbidden: You do not have access to this summary', 403);
    }

    if (item.status === SUMMARY_STATUS.APPROVED) {
        throw new AppError('Cannot delete an item from an approved summary', 400);
    }

    return withTransaction(async (client) => {
        const deleteRes = await client.query(`
            DELETE FROM review_summary_items
            WHERE id = $1
            RETURNING id
        `, [validItemId]);

        if (deleteRes.rowCount === 0) {
            throw new AppError('Failed to delete item, it might have been already deleted', 409);
        }
        
        // Update status to REVIEWING if it was DRAFT
        if (item.status === SUMMARY_STATUS.DRAFT) {
            await client.query(`
                UPDATE review_summaries
                SET status = $1, updated_by = $2, updated_at = NOW()
                WHERE id = $3 AND status = $4
            `, [SUMMARY_STATUS.REVIEWING, currentUser.userId, item.summary_id, SUMMARY_STATUS.DRAFT]);
        }

        return { id: validItemId };
    }, 'REPEATABLE READ').catch(error => {
        if (error.isOperational || (error.status >= 400 && error.status < 600)) throw error;
        throw mapDbError(error, null);
    });
};

export const approveReviewSummary = async (currentUser, submissionId) => {
    await getSubmissionOrFail(currentUser, submissionId);

    return withTransaction(async (client) => {
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

        return {
            id: summary.id,
            status: SUMMARY_STATUS.APPROVED,
            updatedAt: updateRes.rows[0].updated_at
        };
    }, 'REPEATABLE READ').catch(error => {
        if (error.isOperational || (error.status >= 400 && error.status < 600)) throw error;
        throw mapDbError(error, error.code === '55P03' ? 'The summary is currently being updated by another teacher. Please try again.' : null);
    });
};

/**
 * GET /api/summary/submissions/:submissionId/summary/status
 * Returns { status: 'pending' | 'processing' | 'done' | 'failed', errorReason: string | null }
 * Strictly requires TEACHER class ownership or ADMIN role. Blocks STUDENT with 403.
 */
export const getSummaryStatus = async (currentUser, submissionId) => {
    if (currentUser.role === 'STUDENT') {
        throw new AppError('Forbidden: Students are not authorized to access synthesis status', 403);
    }

    const submission = await getSubmissionOrFail(currentUser, submissionId);

    const summaryRes = await pool.query(`
        SELECT status, updated_at
        FROM review_summaries
        WHERE submission_id = $1
    `, [submission.submission_id]);

    if (summaryRes.rowCount === 0) {
        return {
            status: 'pending',
            errorReason: null,
        };
    }

    const row = summaryRes.rows[0];
    let status = 'done';

    if (row.status === 'APPROVED' || row.status === 'REVIEWING' || row.status === 'DRAFT') {
        status = 'done';
    } else if (row.status === 'PROCESSING') {
        status = 'processing';
    } else if (row.status === 'FAILED') {
        status = 'failed';
    } else if (row.status === 'PENDING') {
        status = 'pending';
    }

    return {
        status,
        errorReason: status === 'failed' ? 'LLM_PROCESSING_FAILED' : null,
    };
};

export const generateSubmissionSummary = async (currentUser, submissionId) => {
    // 1. Kiểm tra quyền theo ngữ cảnh (throws 404/403)
    const targetSubmission = await getSubmissionOrFail(currentUser, submissionId);
    const validSubmissionId = targetSubmission.submission_id;
    
    // 2. In-memory concurrency lock (prevents parallel calls)
    if (generationLocks.has(validSubmissionId)) {
        throw new AppError('Synthesis is already generating for this submission', 409);
    }
    generationLocks.add(validSubmissionId);

    try {
        // 2. Fetch all reviews for this submission
        const reviewsQuery = `
            SELECT r.overall_comment, rc.comment as criteria_comment
            FROM reviews r
            JOIN review_assignments ra ON r.review_assignment_id = ra.id
            LEFT JOIN review_criteria rc ON rc.review_id = r.id
            WHERE ra.submission_id = $1
        `;
        const reviewsRes = await pool.query(reviewsQuery, [validSubmissionId]);
        
        let textChunks = [];
        for (const row of reviewsRes.rows) {
            if (row.overall_comment) textChunks.push(row.overall_comment.trim());
            if (row.criteria_comment) textChunks.push(row.criteria_comment.trim());
        }
        
        textChunks = textChunks.filter(t => t.length > 5); // Filter empty/short
        if (textChunks.length === 0) {
            throw new AppError('Chưa có nhận xét nào để tổng hợp', 400);
        }

        // Generate a request ID for logging
        const requestId = crypto.randomUUID();

        // 3. Call AI Service (reuses assignment synthesis logic)
        // synthesizeReviews handles AI_MOCK internally!
        const synthesis = await synthesizeReviews(
            validSubmissionId, // Used as cache key segment
            'submission',
            textChunks,
            textChunks.length,
            textChunks.length,
            requestId,
            true // forceRefresh = true to generate fresh AI summary
        );

        if (synthesis.summary?.startsWith("Lỗi")) {
            throw new AppError('AI synthesis failed. Please try again later.', 500);
        }

        // 4. Database Transaction for Upsert
        await withTransaction(async (client) => {
            // Check if existing summary (SELECT FOR UPDATE)
            const checkRes = await client.query(
                `SELECT id FROM review_summaries WHERE submission_id = $1 FOR UPDATE`, 
                [validSubmissionId]
            );

            let summaryId;
            if (checkRes.rowCount > 0) {
                // Upsert: REGENERATE
                summaryId = checkRes.rows[0].id;
                
                // Delete old items
                await client.query(`DELETE FROM review_summary_items WHERE summary_id = $1`, [summaryId]);
                
                // Update summary metadata
                await client.query(`
                    UPDATE review_summaries 
                    SET status = 'DRAFT', updated_by = $1, updated_at = NOW(), generated_at = NOW()
                    WHERE id = $2
                `, [currentUser.userId, summaryId]);
            } else {
                // Insert new
                const insertRes = await client.query(`
                    INSERT INTO review_summaries (submission_id, status, updated_by)
                    VALUES ($1, 'DRAFT', $2)
                    RETURNING id
                `, [validSubmissionId, currentUser.userId]);
                summaryId = insertRes.rows[0].id;
            }

            // Insert new items
            const insertItemQuery = `
                INSERT INTO review_summary_items (summary_id, topic_category, content, frequency_count)
                VALUES ($1, $2, $3, $4)
            `;

            const categories = [
                { key: 'STRENGTHS', items: synthesis.strengths },
                { key: 'WEAKNESSES', items: synthesis.weaknesses },
                { key: 'SUGGESTIONS', items: synthesis.suggestions }
            ];

            for (const cat of categories) {
                if (Array.isArray(cat.items)) {
                    for (const text of cat.items) {
                        if (text && text.trim().length > 0) {
                            await client.query(insertItemQuery, [
                                summaryId, 
                                cat.key, 
                                text.trim(), 
                                1 // Default frequency
                            ]);
                        }
                    }
                }
            }
        });

        return { message: 'Success' };

    } finally {
        // MUST release lock
        generationLocks.delete(validSubmissionId);
    }
};

