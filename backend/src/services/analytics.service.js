import pool from '../config/db.js';
import AppError from '../utils/AppError.js';
import { ACTIVITY_TYPES } from '../utils/constants.js';

// Helper for 2 decimal rounding
const round2 = (num) => Math.round(num * 100) / 100;

// Configuration for contribution calculation
const WEIGHTS = Object.freeze({
    ACTIVITY: 0.4,
    COMPLETION: 0.4,
    CREATE: 0.2
});
const FREE_RIDER_THRESHOLD = 0.1;

/**
 * Helper function to calculate contribution metrics for a member
 */
function calculateContribution(m, maxActivities, maxTasksCreated) {
    const activityScore = maxActivities > 0 ? m.totalActivities / maxActivities : 0;
    
    let completionRate = null;
    let completionScore = 0;
    if (m.tasksAssigned > 0) {
        completionRate = Math.min(1, m.tasksCompleted / m.tasksAssigned);
        completionScore = completionRate * Math.min(1, m.tasksAssigned / 3);
    }

    const createScore = maxTasksCreated > 0 ? m.tasksCreated / maxTasksCreated : 0;

    const contributionScore = round2(
        (WEIGHTS.ACTIVITY * activityScore) + 
        (WEIGHTS.COMPLETION * completionScore) + 
        (WEIGHTS.CREATE * createScore)
    );
    
    const isFreeRider = contributionScore < FREE_RIDER_THRESHOLD || 
        (m.tasksAssigned > 0 && completionRate === 0 && activityScore < 0.2);
        
    const isInactive = m.totalActivities === 0 && m.tasksAssigned === 0;

    return {
        ...m,
        completionRate: completionRate !== null ? round2(completionRate) : null,
        contributionScore,
        isFreeRider,
        isInactive
    };
}


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

export const getGroupContribution = async (currentUser, groupId) => {
    const isAdmin = currentUser.role === 'ADMIN';

    const groupRes = await pool.query(`
        SELECT c.teacher_id 
        FROM groups g
        JOIN classes c ON g.class_id = c.id
        WHERE g.id = $1
    `, [groupId]);

    if (groupRes.rowCount === 0) {
        throw new AppError('Group not found', 404);
    }
    if (!isAdmin && groupRes.rows[0].teacher_id !== currentUser.userId) {
        throw new AppError('Forbidden: You do not have access to this group', 403);
    }

    const [membersRes, activitiesRes, tasksAssignedRes, tasksCreatedRes] = await Promise.all([
        pool.query(`
            SELECT u.id as user_id, u.full_name as name
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = $1
        `, [groupId]),
        pool.query(`
            SELECT 
                user_id,
                SUM(action_count)::int as total_activities,
                json_object_agg(action_type, action_count) as activity_breakdown
            FROM (
                SELECT user_id, action_type, COUNT(*) as action_count
                FROM activity_logs
                WHERE group_id = $1
                GROUP BY user_id, action_type
            ) sub
            GROUP BY user_id
        `, [groupId]),
        pool.query(`
            SELECT 
                assignee_id as user_id,
                COUNT(*) as tasks_assigned,
                COUNT(*) FILTER (WHERE status = 'DONE') as tasks_completed
            FROM tasks
            WHERE group_id = $1 AND assignee_id IS NOT NULL
            GROUP BY assignee_id
        `, [groupId]),
        pool.query(`
            SELECT 
                created_by as user_id,
                COUNT(*) as tasks_created
            FROM tasks
            WHERE group_id = $1
            GROUP BY created_by
        `, [groupId])
    ]);

    const defaultBreakdown = Object.values(ACTIVITY_TYPES).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
    }, {});

    const memberMap = new Map();
    membersRes.rows.forEach(m => {
        memberMap.set(m.user_id, {
            userId: m.user_id,
            name: m.name,
            totalActivities: 0,
            activityBreakdown: { ...defaultBreakdown },
            tasksAssigned: 0,
            tasksCompleted: 0,
            tasksCreated: 0
        });
    });

    activitiesRes.rows.forEach(a => {
        const member = memberMap.get(a.user_id);
        if (member) {
            member.totalActivities = a.total_activities || 0;
            member.activityBreakdown = { ...defaultBreakdown, ...(a.activity_breakdown || {}) };
        }
    });

    tasksAssignedRes.rows.forEach(t => {
        const member = memberMap.get(t.user_id);
        if (member) {
            member.tasksAssigned = parseInt(t.tasks_assigned, 10) || 0;
            member.tasksCompleted = parseInt(t.tasks_completed, 10) || 0;
        }
    });

    tasksCreatedRes.rows.forEach(t => {
        const member = memberMap.get(t.user_id);
        if (member) {
            member.tasksCreated = parseInt(t.tasks_created, 10) || 0;
        }
    });

    const members = Array.from(memberMap.values());
    const maxActivities = Math.max(0, ...members.map(m => m.totalActivities));
    const maxTasksCreated = Math.max(0, ...members.map(m => m.tasksCreated));

    const result = members.map(m => calculateContribution(m, maxActivities, maxTasksCreated));

    // Sort by contribution score DESC
    result.sort((a, b) => b.contributionScore - a.contributionScore);
    
    // Add rank with tie-breaking
    let currentRank = 1;
    for (let i = 0; i < result.length; i++) {
        if (i > 0 && result[i].contributionScore < result[i - 1].contributionScore) {
            currentRank = i + 1;
        }
        result[i].rank = currentRank;
    }

    return result;
};

export const getClassContributions = async (currentUser, classId) => {
    const isAdmin = currentUser.role === 'ADMIN';

    const classRes = await pool.query(`
        SELECT teacher_id 
        FROM classes
        WHERE id = $1
    `, [classId]);

    if (classRes.rowCount === 0) {
        throw new AppError('Class not found', 404);
    }
    if (!isAdmin && classRes.rows[0].teacher_id !== currentUser.userId) {
        throw new AppError('Forbidden: You do not have access to this class', 403);
    }

    const [membersRes, activitiesRes, tasksAssignedRes, tasksCreatedRes] = await Promise.all([
        pool.query(`
            SELECT gm.group_id, u.id as user_id
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            JOIN groups g ON gm.group_id = g.id
            WHERE g.class_id = $1
        `, [classId]),
        pool.query(`
            SELECT 
                al.group_id,
                al.user_id,
                COUNT(*) as total_activities
            FROM activity_logs al
            JOIN groups g ON al.group_id = g.id
            WHERE g.class_id = $1
            GROUP BY al.group_id, al.user_id
        `, [classId]),
        pool.query(`
            SELECT 
                t.group_id,
                t.assignee_id as user_id,
                COUNT(*) as tasks_assigned,
                COUNT(*) FILTER (WHERE t.status = 'DONE') as tasks_completed
            FROM tasks t
            JOIN groups g ON t.group_id = g.id
            WHERE g.class_id = $1 AND t.assignee_id IS NOT NULL
            GROUP BY t.group_id, t.assignee_id
        `, [classId]),
        pool.query(`
            SELECT 
                t.group_id,
                t.created_by as user_id,
                COUNT(*) as tasks_created
            FROM tasks t
            JOIN groups g ON t.group_id = g.id
            WHERE g.class_id = $1
            GROUP BY t.group_id, t.created_by
        `, [classId])
    ]);

    const groupsMap = new Map();

    membersRes.rows.forEach(m => {
        if (!groupsMap.has(m.group_id)) groupsMap.set(m.group_id, new Map());
        const groupMembers = groupsMap.get(m.group_id);
        groupMembers.set(m.user_id, {
            userId: m.user_id,
            totalActivities: 0,
            tasksAssigned: 0,
            tasksCompleted: 0,
            tasksCreated: 0
        });
    });

    activitiesRes.rows.forEach(a => {
        const groupMembers = groupsMap.get(a.group_id);
        if (groupMembers) {
            const member = groupMembers.get(a.user_id);
            if (member) member.totalActivities = parseInt(a.total_activities, 10) || 0;
        }
    });

    tasksAssignedRes.rows.forEach(t => {
        const groupMembers = groupsMap.get(t.group_id);
        if (groupMembers) {
            const member = groupMembers.get(t.user_id);
            if (member) {
                member.tasksAssigned = parseInt(t.tasks_assigned, 10) || 0;
                member.tasksCompleted = parseInt(t.tasks_completed, 10) || 0;
            }
        }
    });

    tasksCreatedRes.rows.forEach(t => {
        const groupMembers = groupsMap.get(t.group_id);
        if (groupMembers) {
            const member = groupMembers.get(t.user_id);
            if (member) {
                member.tasksCreated = parseInt(t.tasks_created, 10) || 0;
            }
        }
    });

    const result = [];

    groupsMap.forEach((membersMap, groupId) => {
        const members = Array.from(membersMap.values());
        const maxActivities = Math.max(0, ...members.map(m => m.totalActivities));
        const maxTasksCreated = Math.max(0, ...members.map(m => m.tasksCreated));

        let hasFreeRider = false;

        for (const m of members) {
            const metrics = calculateContribution(m, maxActivities, maxTasksCreated);
            if (metrics.isFreeRider) {
                hasFreeRider = true;
                break; // Early exit optimization
            }
        }

        result.push({
            groupId,
            hasFreeRider
        });
    });

    return result;
};
