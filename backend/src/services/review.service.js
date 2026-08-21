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
            created_at: row.created_at,
            version_number: row.version_number
            // We intentionally do not pass file_url to masking to enforce proxy usage
        });

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
