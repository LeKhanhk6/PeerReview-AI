import pool from '../config/db.js';
import { SUBMISSION_STATUS, REVIEW_STATUS } from '../utils/submission.constants.js';

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

export const getStudentDashboardData = async (userId, limit, offset, sortColumn, sortOrder) => {
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
                ra.review_assignment_id,
                ra.review_status as db_review_status
            FROM assignments a
            JOIN groups g ON g.class_id = a.class_id
            JOIN group_members gm ON gm.group_id = g.id
            LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = g.id
            LEFT JOIN submission_versions sv ON sv.submission_id = s.id
            LEFT JOIN (
                SELECT 
                    submission_id, 
                    MAX(status) as review_status,
                    MAX(id) as review_assignment_id
                FROM review_assignments
                GROUP BY submission_id
            ) ra ON ra.submission_id = s.id
            WHERE gm.user_id = $1
            ORDER BY a.id, sv.created_at DESC
        )
        SELECT * FROM DashboardData
        ORDER BY ${sortColumn === 'a.deadline' ? 'deadline' : 'assignment_created_at'} ${sortOrder}
        LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(sortedQuery, [userId, limit, offset]);
    const now = new Date();

    const mappedData = result.rows.map(row => {
        const submission = row.submission_id ? row : null;
        const review = row.review_assignment_id ? row : null;
        
        const deadline = new Date(row.deadline);
        const submission_status = getSubmissionStatus(submission, deadline);
        const review_status = getReviewStatus(review);

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
};
