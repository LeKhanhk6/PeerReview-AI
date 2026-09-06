import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
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

// Constant to define reviews per group
const REVIEWS_PER_GROUP = 5;

/**
 * Converts any string or numeric seed into a 32-bit integer seed for PRNG
 */
function stringToSeed(str) {
    if (typeof str === 'number') return str;
    let hash = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
        hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0;
    }
    return hash;
}

/**
 * Mulberry32 PRNG for deterministic random generation
 */
function mulberry32(a) {
    let seed = stringToSeed(a);
    return function() {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

/**
 * Shuffles an array in place deterministically using a seed
 */
function shuffleArray(array, seed) {
    const random = mulberry32(seed);
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
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

    // 1.5 Invariant Check: Prevent regenerating if completed reviews exist.
    // If no completed reviews exist, allow re-generating to include newly submitted groups.
    const completedCheck = await pool.query(`
        SELECT COUNT(r.id) as count 
        FROM reviews r
        JOIN review_assignments ra ON r.review_assignment_id = ra.id
        JOIN submissions s ON s.id = ra.submission_id
        WHERE s.assignment_id = $1
    `, [validAssignmentId]);

    if (parseInt(completedCheck.rows[0].count, 10) > 0) {
        throw new AppError('Assignments already generated and locked by completed reviews', 400);
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

    // 4. Shuffle submissionPool to randomize assignment (Deterministic based on assignmentId)
    shuffleArray(submissionPool, validAssignmentId);

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
    return withTransaction(async (client) => {
        // Handle duplicate runs (DELETE old ones before insert)
        // SHOULD NEVER RUN due to invariant check (Dynamic Membership Guard)
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

        logger.info({ event: 'review_assignment_generated', assignmentId: validAssignmentId, total: assignmentsToInsert.length });

        // 7. Return summary
        return {
            totalAssignments: assignmentsToInsert.length,
            groups: n,
            reviewsPerGroup
        };
    }, 'REPEATABLE READ').catch(err => {
        logger.error({ event: 'generateReviewAssignments_failed', assignmentId: validAssignmentId, error: err.message });
        if (err instanceof AppError) throw err;
        throw new AppError(err.message || 'Failed to generate review assignments', 500, { original: err.message });
    });
};
