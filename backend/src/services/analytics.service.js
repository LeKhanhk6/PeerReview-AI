import pool from '../config/db.js';
import AppError from '../utils/AppError.js';

export const getDashboardOverview = async (currentUser, classId) => {
    const isAdmin = currentUser.role === 'ADMIN';

    // 1. Validate ownership if classId is provided
    if (classId) {
        const classRes = await pool.query(`SELECT teacher_id FROM classes WHERE id = $1`, [classId]);
        if (classRes.rowCount === 0) {
            throw new AppError('Class not found', 404);
        }
        if (!isAdmin && classRes.rows[0].teacher_id !== currentUser.userId) {
            throw new AppError('Forbidden: You do not have access to this class', 403);
        }
    }

    // Helper for 2 decimal rounding
    const round2 = (num) => Math.round(num * 100) / 100;

    const filteredClassesCTE = `
        WITH filtered_classes AS (
            SELECT id 
            FROM classes
            WHERE ($2::boolean OR teacher_id = $1)
              AND ($3::uuid IS NULL OR id = $3::uuid)
        )
    `;

    // 2. Fetch Base Metrics (Classes, Students, Assignments, Expected Submissions)
    const baseMetricsQuery = `
        ${filteredClassesCTE},
        class_groups AS (
            SELECT c.id as class_id, COUNT(g.id) as group_count
            FROM filtered_classes c
            LEFT JOIN groups g ON c.id = g.class_id
            GROUP BY c.id
        ),
        class_assignments AS (
            SELECT c.id as class_id, COUNT(a.id) as assignment_count
            FROM filtered_classes c
            LEFT JOIN assignments a ON c.id = a.class_id
            GROUP BY c.id
        )
        SELECT 
            (SELECT COUNT(*) FROM filtered_classes) as total_classes,
            (SELECT COALESCE(SUM(cg.group_count * ca.assignment_count), 0)
             FROM class_groups cg
             JOIN class_assignments ca ON cg.class_id = ca.class_id) as expected_submissions,
            (SELECT COUNT(DISTINCT gm.user_id)
             FROM filtered_classes c
             JOIN groups g ON c.id = g.class_id
             JOIN group_members gm ON g.id = gm.group_id) as total_students,
            (SELECT COALESCE(SUM(assignment_count), 0) FROM class_assignments) as total_assignments
    `;

    // 3. Fetch Actual Submissions
    const submissionsQuery = `
        ${filteredClassesCTE}
        SELECT COUNT(DISTINCT (s.group_id, s.assignment_id)) as actual_submissions
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        JOIN filtered_classes c ON a.class_id = c.id
    `;

    // 4. Fetch Reviews Metrics (Note: expected_reviews is the number of reviews already assigned, not theoretical max)
    const reviewsQuery = `
        ${filteredClassesCTE}
        SELECT 
            COUNT(ra.id) as expected_reviews,
            COUNT(CASE WHEN ra.status = 'COMPLETED' THEN 1 END) as completed_reviews,
            AVG(CASE WHEN ra.status = 'COMPLETED' THEN r.total_score END) as average_score
        FROM review_assignments ra
        JOIN submissions s ON ra.submission_id = s.id
        JOIN assignments a ON s.assignment_id = a.id
        JOIN filtered_classes c ON a.class_id = c.id
        LEFT JOIN reviews r ON r.review_assignment_id = ra.id
    `;

    // Execute queries concurrently
    const [baseRes, subRes, revRes] = await Promise.all([
        pool.query(baseMetricsQuery, [currentUser.userId, isAdmin, classId]),
        pool.query(submissionsQuery, [currentUser.userId, isAdmin, classId]),
        pool.query(reviewsQuery, [currentUser.userId, isAdmin, classId])
    ]);

    const baseData = baseRes.rows[0];
    const subData = subRes.rows[0];
    const revData = revRes.rows[0];

    const expectedSubmissions = parseInt(baseData.expected_submissions, 10) || 0;
    const actualSubmissions = parseInt(subData.actual_submissions, 10) || 0;
    const submissionRate = expectedSubmissions > 0 
        ? round2((actualSubmissions / expectedSubmissions) * 100)
        : 0;

    const expectedReviews = parseInt(revData.expected_reviews, 10) || 0;
    const completedReviews = parseInt(revData.completed_reviews, 10) || 0;
    const reviewCompletionRate = expectedReviews > 0
        ? round2((completedReviews / expectedReviews) * 100)
        : 0;

    const totalAssignments = parseInt(baseData.total_assignments, 10) || 0;

    return {
        totalClasses: parseInt(baseData.total_classes, 10) || 0,
        totalStudents: parseInt(baseData.total_students, 10) || 0,
        totalAssignments,
        hasAssignments: totalAssignments > 0,
        expectedSubmissions,
        actualSubmissions,
        expectedReviews,
        completedReviews,
        submissionRate,
        reviewCompletionRate,
        averageScore: revData.average_score ? round2(Number(revData.average_score)) : 0
    };
};
