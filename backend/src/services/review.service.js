import pool from '../config/db.js';
import { maskSubmissionEntity } from '../utils/masking.util.js';

export const getMyReviewAssignments = async (assignmentId, userId, limit, offset) => {
    // 1. Get total count
    const countQuery = `
        SELECT COUNT(*) as total
        FROM review_assignments ra
        JOIN submissions s ON s.id = ra.submission_id
        WHERE s.assignment_id = $1
        AND ra.reviewer_group_id IN (
            SELECT group_id FROM group_members WHERE user_id = $2
        )
    `;
    const countResult = await pool.query(countQuery, [assignmentId, userId]);
    const total = parseInt(countResult.rows[0].total, 10);

    if (total === 0) {
        return { rows: [], total: 0 };
    }

    // 2. Fetch data
    const query = `
        SELECT 
            ra.id as review_assignment_id,
            ra.status as review_status,
            ra.assigned_at,
            s.id as submission_id,
            sv.version_number,
            sv.created_at,
            sv.file_url
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

    // 3. Apply masking at the SERVICE layer
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
        const error = new Error('Review assignment not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }

    const row = result.rows[0];

    // 2. Fetch rubric
    const { getRubricAndCriteria } = await import('./rubric.service.js');
    const rubricData = await getRubricAndCriteria(row.assignment_id);

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

    // 3. Fetch review data if COMPLETED
    let review = null;
    let isEditable = true;
    if (row.review_status === 'COMPLETED') {
        isEditable = false;
        const reviewRes = await pool.query(`
            SELECT id, overall_comment, total_score, submitted_at
            FROM reviews
            WHERE review_assignment_id = $1
        `, [reviewAssignmentId]);
        
        if (reviewRes.rows.length > 0) {
            const reviewData = reviewRes.rows[0];
            const criteriaRes = await pool.query(`
                SELECT rubric_criteria_id, score, comment
                FROM review_criteria
                WHERE review_id = $1
            `, [reviewData.id]);
            
            review = {
                scores: criteriaRes.rows.map(c => ({
                    criteriaId: c.rubric_criteria_id,
                    score: parseFloat(c.score),
                    comment: c.comment
                })),
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
            reviewDeadline: row.assignment_deadline
        },
        rubric: sanitizedRubric,
        review
    };
};
