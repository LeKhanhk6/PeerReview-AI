import pool from '../config/db.js';
import AppError from '../utils/AppError.js';

const validateId = (id, fieldName = 'ID') => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    return numericId;
};

// Constant to define reviews per group
const REVIEWS_PER_GROUP = 2;

/**
 * Shuffles an array in place (Fisher-Yates)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export const generateReviewAssignments = async (assignmentId, userId, reviewsPerGroup = REVIEWS_PER_GROUP) => {
    const validAssignmentId = validateId(assignmentId, 'assignment ID');
    const validUserId = validateId(userId, 'user ID');
    
    // 1. Validation & Auth (Fail-fast)
    const authQuery = `
        SELECT 1
        FROM assignments a
        JOIN classes c ON c.id = a.class_id
        WHERE a.id = $1 AND c.teacher_id = $2
    `;
    const authResult = await pool.query(authQuery, [validAssignmentId, validUserId]);
    
    if (authResult.rows.length === 0) {
        const checkExists = await pool.query('SELECT id FROM assignments WHERE id = $1', [validAssignmentId]);
        throw new AppError(
            checkExists.rows.length > 0 ? 'Forbidden: Only the teacher of this class can generate review assignments.' : 'Assignment not found',
            checkExists.rows.length > 0 ? 403 : 404
        );
    }

    // 1.5 Invariant Check: Prevent regenerating assignments (Dynamic Membership Guard)
    const existingCheck = await pool.query(`
        SELECT COUNT(*) as count 
        FROM review_assignments ra
        JOIN submissions s ON s.id = ra.submission_id
        WHERE s.assignment_id = $1
    `, [validAssignmentId]);

    if (parseInt(existingCheck.rows[0].count, 10) > 0) {
        throw new AppError('Assignments already generated', 400);
    }

    // 2. Get groups and their latest submission for this assignment (Submission Pool)
    const submissionsQuery = `
        SELECT DISTINCT ON (s.group_id)
            s.id as submission_id,
            s.group_id
        FROM submissions s
        JOIN submission_versions sv ON sv.submission_id = s.id
        WHERE s.assignment_id = $1
        ORDER BY s.group_id, sv.version_number DESC, sv.created_at DESC
    `;
    const submissionsResult = await pool.query(submissionsQuery, [validAssignmentId]);
    
    if (submissionsResult.rows.length === 0) {
        return {
            totalAssignments: 0,
            groups: 0,
            reviewsPerGroup
        };
    }

    const submissionPool = submissionsResult.rows.map(row => ({
        groupId: row.group_id,
        submissionId: row.submission_id
    }));

    // 3. Validate constraints
    if (submissionPool.length < 2) {
        throw new AppError("Not enough submissions to perform peer review assignment.", 400);
    }

    if (submissionPool.length <= reviewsPerGroup) {
        throw new AppError(`Not enough groups (${submissionPool.length}) to satisfy ${reviewsPerGroup} reviews per group.`, 400);
    }

    // 4. Shuffle submissionPool to randomize assignment
    shuffleArray(submissionPool);

    // 5. Generate assignments (circular shift algorithm)
    const assignmentsToInsert = [];
    const n = submissionPool.length;

    // For shift = 1 to reviewsPerGroup
    // pool[i] reviews pool[(i + shift) % n]
    for (let shift = 1; shift <= reviewsPerGroup; shift++) {
        for (let i = 0; i < n; i++) {
            const reviewerGroup = submissionPool[i].groupId;
            const targetIndex = (i + shift) % n;
            const targetSubmission = submissionPool[targetIndex].submissionId;
            
            assignmentsToInsert.push({
                submission_id: targetSubmission,
                reviewer_group_id: reviewerGroup
            });
        }
    }

    // 6. Transaction to safely clear old and insert new assignments
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Handle duplicate runs (DELETE old ones before insert)
        const deleteOldQuery = `
            DELETE FROM review_assignments ra
            USING submissions s
            WHERE ra.submission_id = s.id
            AND s.assignment_id = $1
        `;
        await client.query(deleteOldQuery, [validAssignmentId]);

        // Bulk insert new assignments
        if (assignmentsToInsert.length > 0) {
            // Constructing bulk insert query dynamically
            const values = [];
            const queryValues = [];
            let placeholderIndex = 1;

            assignmentsToInsert.forEach(assignment => {
                values.push(`($${placeholderIndex++}, $${placeholderIndex++})`);
                queryValues.push(assignment.submission_id, assignment.reviewer_group_id);
            });

            const insertQuery = `
                INSERT INTO review_assignments (submission_id, reviewer_group_id)
                VALUES ${values.join(', ')}
            `;
            await client.query(insertQuery, queryValues);
        }

        await client.query('COMMIT');
        console.info(`review_assignment_generated:${validAssignmentId}:total=${assignmentsToInsert.length}`);

        // 7. Return summary
        return {
            totalAssignments: assignmentsToInsert.length,
            groups: n,
            reviewsPerGroup
        };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`generateReviewAssignments_failed:${validAssignmentId}`, err);
        if (err instanceof AppError) throw err;
        throw new AppError(err.message || 'Failed to generate review assignments', 500, { original: err.message });
    } finally {
        client.release();
    }
};
