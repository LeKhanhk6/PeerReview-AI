import pool from '../config/db.js';
import { maskSubmissionEntity } from '../utils/masking.util.js';
import { logActivity } from './activity.service.js';
import { ACTIVITY_TYPES } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
import { mapDbError } from '../utils/dbError.util.js';
import { withTransaction } from '../utils/db.util.js';

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

export const getMyReviewAssignments = async (assignmentId, userId, limit, offset) => {
    let query = `
        SELECT 
            ra.id as review_assignment_id,
            ra.status as review_status,
            ra.assigned_at,
            s.id as submission_id,
            s.assignment_id as raw_assignment_id,
            sv.version_number,
            sv.created_at,
            sv.file_url,
            COUNT(*) OVER() as full_count
        FROM review_assignments ra
        JOIN submissions s ON s.id = ra.submission_id
        JOIN LATERAL (
            SELECT sv_inner.version_number, sv_inner.created_at, sv_inner.file_url
            FROM submission_versions sv_inner
            WHERE sv_inner.submission_id = s.id
            ORDER BY sv_inner.version_number DESC
            LIMIT 1
        ) sv ON true
        WHERE ra.reviewer_group_id IN (
            SELECT group_id FROM group_members WHERE user_id = $1
        )
    `;

    const values = [userId];
    let paramIndex = 2;

    if (assignmentId) {
        const validAssignmentId = validateId(assignmentId, 'assignment ID');
        query += ` AND s.assignment_id = $${paramIndex}`;
        values.push(validAssignmentId);
        paramIndex++;
    }

    query += ` ORDER BY ra.assigned_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        return { rows: [], total: 0 };
    }

    const total = parseInt(result.rows[0].full_count, 10);

    // Apply masking at the SERVICE layer
    // NEVER expose raw submission data or group identities
    const rows = result.rows.map(row => {
        const maskedSubmission = maskSubmissionEntity({
            id: row.submission_id,
            created_at: row.created_at
            // We intentionally do not pass version_number to strict double-blind
            // We intentionally do not pass file_url to masking to enforce proxy usage
        }, assignmentId);

        return {
            id: row.review_assignment_id,
            status: row.review_status,
            assignedAt: row.assigned_at,
            submission: maskedSubmission
        };
    });

    return {
        rows,
        total
    };
};

export const getReviewAssignmentDetail = async (reviewAssignmentId, userId) => {
    const validReviewAssignmentId = validateId(reviewAssignmentId, 'review assignment ID');
    // 1. Fetch assignment, submission, and check ownership in one query
    const query = `
        SELECT 
            ra.id as review_assignment_id,
            ra.status as review_status,
            ra.assigned_at,
            s.id as submission_id,
            s.assignment_id,
            sv.created_at as submission_created_at,
            a.title as assignment_title,
            a.description as assignment_description,
            a.deadline as assignment_deadline
        FROM review_assignments ra
        JOIN submissions s ON s.id = ra.submission_id
        JOIN assignments a ON a.id = s.assignment_id
        LEFT JOIN LATERAL (
            SELECT sv_inner.created_at
            FROM submission_versions sv_inner
            WHERE sv_inner.submission_id = s.id
            ORDER BY sv_inner.version_number DESC
            LIMIT 1
        ) sv ON true
        WHERE ra.id = $1
        AND ra.reviewer_group_id IN (
            SELECT group_id FROM group_members WHERE user_id = $2
        )
    `;

    const result = await pool.query(query, [validReviewAssignmentId, userId]);

    if (result.rows.length === 0) {
        // Intentionally returning 404 for both not-found and unauthorized (Anti-enumeration pattern)
        throw new AppError('Review assignment not found or unauthorized', 404);
    }

    const row = result.rows[0];

    // 2. Fetch rubric and attachments
    const { getRubricAndCriteria } = await import('./rubric.service.js');
    const [rubricData, attachmentsRes] = await Promise.all([
        getRubricAndCriteria(row.assignment_id, { role: 'STUDENT', userId }),
        pool.query(`SELECT id, file_name, file_url, file_size FROM assignment_attachments WHERE assignment_id = $1`, [row.assignment_id])
    ]);

    // Trim teacher notes if any exist in the future (currently safe for MVP)
    const sanitizedRubric = rubricData ? {
        id: rubricData.id,
        description: rubricData.description,
        criteria: rubricData.criteria.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            weight: parseFloat(c.weight)
        }))
    } : null;

    // 3. Fetch review data if COMPLETED (Optimized with JSON Aggregation)
    let review = null;
    let isEditable = true;
    if (row.review_status === 'COMPLETED') {
        isEditable = false;
        const reviewQuery = `
            SELECT 
                r.id, 
                r.overall_comment, 
                r.total_score, 
                r.submitted_at,
                (
                    SELECT json_agg(json_build_object(
                        'criteriaId', rc.rubric_criteria_id,
                        'score', rc.score,
                        'comment', rc.comment
                    ))
                    FROM review_criteria rc
                    WHERE rc.review_id = r.id
                ) as scores
            FROM reviews r
            WHERE r.review_assignment_id = $1
        `;
        const reviewRes = await pool.query(reviewQuery, [validReviewAssignmentId]);
        
        if (reviewRes.rows.length > 0) {
            const reviewData = reviewRes.rows[0];
            
            review = {
                scores: reviewData.scores || [],
                comment: reviewData.overall_comment,
                totalScore: parseFloat(reviewData.total_score),
                submittedAt: reviewData.submitted_at
            };
        }
    }

    // 4. Calculate deadline status
    const deadlineTime = new Date(row.assignment_deadline).getTime();
    const isPastDeadline = deadlineTime < Date.now();

    // 5. Apply masking
    const maskedSubmission = maskSubmissionEntity({
        id: row.submission_id,
        created_at: row.submission_created_at
    }, row.assignment_id);

    // 6. Build final structured response
    return {
        reviewAssignment: {
            id: row.review_assignment_id,
            status: row.review_status,
            assignedAt: row.assigned_at,
            isPastDeadline,
            isEditable
        },
        submission: maskedSubmission,
        assignment: {
            title: row.assignment_title,
            description: row.assignment_description,
            reviewDeadline: row.assignment_deadline,
            attachments: attachmentsRes.rows.map(att => ({
                id: att.id,
                fileName: att.file_name,
                fileUrl: att.file_url,
                fileSize: att.file_size
            }))
        },
        rubric: sanitizedRubric,
        review
    };
};

export const submitReview = async (reviewAssignmentId, userId, payload) => {
    const validReviewAssignmentId = validateId(reviewAssignmentId, 'review assignment ID');
    const { overallComment, criteriaScores } = payload;
    
    return withTransaction(async (client) => {
        // 1. Existence, ownership, and lock for race conditions (FOR UPDATE)
        const checkQuery = `
            SELECT 
                ra.id, 
                ra.status, 
                ra.reviewer_group_id,
                s.assignment_id, 
                a.deadline,
                (a.deadline < NOW()) as is_past_deadline
            FROM review_assignments ra
            JOIN submissions s ON s.id = ra.submission_id
            JOIN assignments a ON a.id = s.assignment_id
            WHERE ra.id = $1
            AND ra.reviewer_group_id IN (
                SELECT group_id FROM group_members WHERE user_id = $2
            )
            FOR UPDATE OF ra
        `;
        const checkRes = await client.query(checkQuery, [validReviewAssignmentId, userId]);

        if (checkRes.rows.length === 0) {
            throw new AppError('Review assignment not found or unauthorized', 404); // Anti-enumeration
        }

        const assignmentRow = checkRes.rows[0];

        // 2. Status check (Double-submit protection)
        if (assignmentRow.status === 'COMPLETED') {
            throw new AppError('Review already submitted', 400);
        }

        // 3. Deadline check (from DB)
        if (assignmentRow.is_past_deadline) {
            throw new AppError('Review deadline has passed', 400);
        }

        // 4. DB Criteria check (completeness & validity)
        const rubricRes = await client.query(`
            SELECT rc.id, rc.weight
            FROM rubric_criteria rc
            JOIN rubrics r ON r.id = rc.rubric_id
            WHERE r.assignment_id = $1
        `, [assignmentRow.assignment_id]);

        const dbCriteriaMap = new Map();
        rubricRes.rows.forEach(row => dbCriteriaMap.set(row.id, parseFloat(row.weight)));

        if (dbCriteriaMap.size !== criteriaScores.length) {
            throw new AppError('Mismatch in number of criteria scores provided', 400);
        }

        let totalScore = 0;
        const processedScores = [];

        for (const item of criteriaScores) {
            if (!dbCriteriaMap.has(item.criteriaId)) {
                throw new AppError(`Criteria ${item.criteriaId} does not belong to this assignment`, 400);
            }

            const weight = dbCriteriaMap.get(item.criteriaId);
            
            const rawScore = parseFloat(item.score);
            if (isNaN(rawScore) || rawScore < 0 || rawScore > weight) {
                throw new AppError(`Invalid score for criteria ${item.criteriaId}. Score must be between 0 and its max weight (${weight})`, 400);
            }

            // Optional: normalize score precision
            const score = Math.round(rawScore * 100) / 100;
            const itemComment = item.comment ? item.comment.trim() : null;
            if (itemComment && itemComment.length > 1000) {
                throw new AppError(`Comment for criteria ${item.criteriaId} exceeds maximum length of 1000 characters`, 400);
            }

            // total_score = SUM(score * weight / 100)
            totalScore += (score * weight) / 100;

            processedScores.push({
                criteriaId: item.criteriaId,
                score,
                comment: itemComment
            });
        }
        
        // Normalize total score
        totalScore = Math.round(totalScore * 100) / 100;

        // 5. Update status (Conditional UPDATE to prevent last-mile race condition)
        // DO THIS FIRST so we don't insert garbage if it fails
        const updateRes = await client.query(`
            UPDATE review_assignments ra
            SET status = 'COMPLETED'
            WHERE ra.id = $1 AND ra.status = 'PENDING'
            AND EXISTS (
                SELECT 1 FROM submissions s 
                JOIN assignments a ON s.assignment_id = a.id
                WHERE s.id = ra.submission_id 
                AND a.deadline >= NOW()
            )
            RETURNING ra.id
        `, [validReviewAssignmentId]);

        if (updateRes.rowCount === 0) {
            throw new AppError('Review already submitted or deadline has passed', 400);
        }

        // 6. Insert review
        const insertReviewRes = await client.query(`
            INSERT INTO reviews (review_assignment_id, overall_comment, total_score, submitted_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, total_score, submitted_at
        `, [validReviewAssignmentId, overallComment, totalScore]);

        const reviewRow = insertReviewRes.rows[0];
        const reviewId = reviewRow.id;

        // 7. Insert review criteria (Bulk insert for performance)
        if (processedScores.length > 0) {
            const insertParams = [reviewId];
            const insertValues = [];
            let paramIndex = 2;
            
            for (const ps of processedScores) {
                insertValues.push(`($1, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
                insertParams.push(ps.criteriaId, ps.score, ps.comment);
                paramIndex += 3;
            }
            
            const bulkInsertQuery = `
                INSERT INTO review_criteria (review_id, rubric_criteria_id, score, comment)
                VALUES ${insertValues.join(', ')}
            `;
            await client.query(bulkInsertQuery, insertParams);
        }

        // 8. Activity Tracking
        try {
            await logActivity({
                groupId: assignmentRow.reviewer_group_id,
                userId,
                actionType: ACTIVITY_TYPES.REVIEW_SUBMITTED,
                targetId: `${ACTIVITY_TYPES.REVIEW_SUBMITTED}_${validReviewAssignmentId}`,
                metadata: { scoreGiven: totalScore, totalCriteria: processedScores.length },
                contentSummary: `Submitted a peer review (Score: ${totalScore})`
            });
        } catch (logErr) {
            logger.error({ 
                event: 'activity_log_error', 
                message: 'Activity log failed during review submission', 
                error: logErr.message 
            });
        }

        return {
            reviewId,
            totalScore,
            status: 'COMPLETED',
            submittedAt: reviewRow.submitted_at,
            criteriaCount: processedScores.length
        };
    }, 'REPEATABLE READ').catch(error => {
        if (error.isOperational || (error.status >= 400 && error.status < 600)) throw error;
        throw mapDbError(error, error.code === '23505' ? 'Review already submitted' : null);
    });
};

/**
 * Lấy tất cả reviews của một bài tập, áp dụng Hybrid Sampling nếu quá nhiều.
 * @param {string} assignmentId 
 * @returns {Promise<Array<string>>} Mảng các chuỗi nhận xét gộp
 */
export const getAssignmentReviewsForSynthesis = async (assignmentId, timeframe) => {
    const validAssignmentId = validateId(assignmentId, 'assignment ID');
    let query = `
        SELECT 
            r.overall_comment,
            r.submitted_at,
            (SELECT string_agg(rc.comment, ' ') FROM review_criteria rc WHERE rc.review_id = r.id AND rc.comment IS NOT NULL AND rc.comment != '') as criteria_comments
        FROM reviews r
        JOIN review_assignments ra ON ra.id = r.review_assignment_id
        JOIN submissions s ON s.id = ra.submission_id
        WHERE s.assignment_id = $1
    `;
    const values = [validAssignmentId];

    if (timeframe?.from) {
        values.push(timeframe.from);
        query += ` AND r.submitted_at >= $${values.length}`;
    }
    if (timeframe?.to) {
        values.push(timeframe.to);
        query += ` AND r.submitted_at <= $${values.length}`;
    }

    const result = await pool.query(query, values);

    let reviews = result.rows.map(r => {
        let text = '';
        if (r.overall_comment) text += r.overall_comment + ' ';
        if (r.criteria_comments) text += r.criteria_comments;
        text = text.trim();
        return {
            text,
            length: text.length,
            submittedAt: new Date(r.submitted_at).getTime()
        };
    }).filter(r => r.text.length > 10); // Bỏ qua những review quá ngắn

    const totalAvailable = reviews.length;
    
    // Hybrid Sampling: Nếu > 100, lấy top 100 (40 newest, 40 longest, 20 random)
    if (reviews.length > 100) {
        const selected = new Set();
        
        // 40 newest
        reviews.sort((a, b) => b.submittedAt - a.submittedAt);
        const newest = reviews.slice(0, 40);
        newest.forEach(r => selected.add(r));
        
        // Loại bỏ những cái đã chọn để chọn longest
        let remaining = reviews.filter(r => !selected.has(r));
        
        // 40 longest
        remaining.sort((a, b) => b.length - a.length);
        const longest = remaining.slice(0, 40);
        longest.forEach(r => selected.add(r));
        
        // Loại tiếp để chọn random
        remaining = reviews.filter(r => !selected.has(r));
        
        // 20 random
        const shuffled = remaining.sort(() => 0.5 - Math.random());
        const randoms = shuffled.slice(0, 20);
        randoms.forEach(r => selected.add(r));
        
        reviews = Array.from(selected);
    }
    
    return {
        reviewsText: reviews.map(r => r.text),
        totalReviews: totalAvailable,
        reviewsUsed: reviews.length
    };
};
