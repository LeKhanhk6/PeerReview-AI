import pool from '../config/db.js';
import { maskSubmissionEntity } from '../utils/masking.util.js';

export const getMyReviewAssignments = async (assignmentId, userId, limit, offset) => {
    // Use COUNT(*) OVER() to avoid a separate query
    const query = `
        SELECT 
            ra.id as review_assignment_id,
            ra.status as review_status,
            ra.assigned_at,
            s.id as submission_id,
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
        WHERE s.assignment_id = $1
        AND ra.reviewer_group_id IN (
            SELECT group_id FROM group_members WHERE user_id = $2
        )
        ORDER BY ra.assigned_at DESC
        LIMIT $3 OFFSET $4
    `;

    const result = await pool.query(query, [assignmentId, userId, limit, offset]);

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

    const result = await pool.query(query, [reviewAssignmentId, userId]);

    if (result.rows.length === 0) {
        // Intentionally returning 404 for both not-found and unauthorized (Anti-enumeration pattern)
        const error = new Error('Review assignment not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }

    const row = result.rows[0];

    // 2. Fetch rubric and attachments
    const { getRubricAndCriteria } = await import('./rubric.service.js');
    const [rubricData, attachmentsRes] = await Promise.all([
        getRubricAndCriteria(row.assignment_id),
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
        const reviewRes = await pool.query(reviewQuery, [reviewAssignmentId]);
        
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
    const { overallComment, criteriaScores } = payload;
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query('BEGIN');
        transactionStarted = true;

        // 1. Existence, ownership, and lock for race conditions (FOR UPDATE)
        const checkQuery = `
            SELECT 
                ra.id, 
                ra.status, 
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
        const checkRes = await client.query(checkQuery, [reviewAssignmentId, userId]);

        if (checkRes.rows.length === 0) {
            const error = new Error('Review assignment not found or unauthorized');
            error.statusCode = 404; // Anti-enumeration
            throw error;
        }

        const assignmentRow = checkRes.rows[0];

        // 2. Status check (Double-submit protection)
        if (assignmentRow.status === 'COMPLETED') {
            const error = new Error('Review already submitted');
            error.statusCode = 400;
            throw error;
        }

        // 3. Deadline check (from DB)
        if (assignmentRow.is_past_deadline) {
            const error = new Error('Review deadline has passed');
            error.statusCode = 400;
            throw error;
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
            const error = new Error('Mismatch in number of criteria scores provided');
            error.statusCode = 400;
            throw error;
        }

        let totalScore = 0;
        const processedScores = [];

        for (const item of criteriaScores) {
            if (!dbCriteriaMap.has(item.criteriaId)) {
                const error = new Error(`Criteria ${item.criteriaId} does not belong to this assignment`);
                error.statusCode = 400;
                throw error;
            }

            const weight = dbCriteriaMap.get(item.criteriaId);
            // Optional: normalize score precision
            const score = Math.round(parseFloat(item.score) * 100) / 100;
            const itemComment = item.comment ? item.comment.trim() : null;
            if (itemComment && itemComment.length > 1000) {
                const error = new Error(`Comment for criteria ${item.criteriaId} exceeds maximum length of 1000 characters`);
                error.statusCode = 400;
                throw error;
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
            UPDATE review_assignments
            SET status = 'COMPLETED'
            WHERE id = $1 AND status != 'COMPLETED'
            RETURNING id
        `, [reviewAssignmentId]);

        if (updateRes.rowCount === 0) {
            const error = new Error('Review already submitted');
            error.statusCode = 400;
            throw error;
        }

        // 6. Insert review
        const insertReviewRes = await client.query(`
            INSERT INTO reviews (review_assignment_id, overall_comment, total_score, submitted_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, total_score
        `, [reviewAssignmentId, overallComment, totalScore]);

        const reviewId = insertReviewRes.rows[0].id;

        // 7. Insert review criteria (Bulk insert for performance)
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

        await client.query('COMMIT');

        return {
            reviewId,
            totalScore,
            status: 'COMPLETED'
        };
    } catch (error) {
        if (transactionStarted) {
            await client.query('ROLLBACK');
        }
        if (error.code === '23505') {
            error.statusCode = 400;
            error.message = 'Review already submitted';
        }
        throw error;
    } finally {
        client.release();
    }
};
