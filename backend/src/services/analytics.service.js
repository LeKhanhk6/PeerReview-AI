import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
import { ACTIVITY_TYPES } from '../constants/index.js';

// Helper for 2 decimal rounding
const round2 = (num) => Math.round(num * 100) / 100;

// Configuration for contribution calculation
const WEIGHTS = Object.freeze({
    ACTIVITY: 0.4,
    COMPLETION: 0.4,
    CREATE: 0.2
});
const FREE_RIDER_THRESHOLD = 0.1;

const validateId = (id, fieldName = 'ID') => {
    if (id === null || id === undefined) {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    if (typeof id === 'string') {
        const trimmed = id.trim();
        if (!trimmed || trimmed === 'invalid') {
            throw new AppError(`Invalid ${fieldName}`, 400);
        }
        return trimmed;
    }
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
        return numericId;
    }
    throw new AppError(`Invalid ${fieldName}`, 400);
};

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

    let validClassId = null;
    // 1. Validate ownership if classId is provided
    if (classId) {
        validClassId = validateId(classId, 'class ID');
        const classRes = await pool.query(`SELECT teacher_id FROM classes WHERE id = $1`, [validClassId]);
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
    const validGroupId = validateId(groupId, 'group ID');
    const isAdmin = currentUser.role === 'ADMIN';

    const groupRes = await pool.query(`
        SELECT c.teacher_id 
        FROM groups g
        JOIN classes c ON g.class_id = c.id
        WHERE g.id = $1
    `, [validGroupId]);

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
                user_id,
                COUNT(*) as tasks_created
            FROM activity_logs
            WHERE group_id = $1 AND action_type LIKE 'TASK_CREATE%'
            GROUP BY user_id
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
    const validClassId = validateId(classId, 'class ID');
    const isAdmin = currentUser.role === 'ADMIN';

    const classRes = await pool.query(`
        SELECT teacher_id 
        FROM classes
        WHERE id = $1
    `, [validClassId]);

    if (classRes.rowCount === 0) {
        throw new AppError('Class not found', 404);
    }
    if (!isAdmin && classRes.rows[0].teacher_id !== currentUser.userId) {
        throw new AppError('Forbidden: You do not have access to this class', 403);
    }

    const [allGroupsRes, membersRes, activitiesRes, tasksAssignedRes, tasksCreatedRes] = await Promise.all([
        pool.query(`SELECT id, name FROM groups WHERE class_id = $1 ORDER BY created_at ASC`, [classId]),
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
                al.group_id,
                al.user_id,
                COUNT(*) as tasks_created
            FROM activity_logs al
            JOIN groups g ON al.group_id = g.id
            WHERE g.class_id = $1 AND al.action_type LIKE 'TASK_CREATE%'
            GROUP BY al.group_id, al.user_id
        `, [classId])
    ]);

    const groupNamesMap = new Map();
    const groupsMap = new Map();

    allGroupsRes.rows.forEach(g => {
        groupNamesMap.set(g.id, g.name);
        groupsMap.set(g.id, new Map());
    });

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
            groupName: groupNamesMap.get(groupId) || `Nhóm #${groupId}`,
            memberCount: members.length,
            hasFreeRider
        });
    });

    return result;
};

const NO_DATA_REASONS = Object.freeze({
    NO_REVIEWS: "NO_REVIEWS",
    NO_COMPLETED_REVIEWS: "NO_COMPLETED_REVIEWS",
    HAS_PENDING_REVIEWS: "HAS_PENDING_REVIEWS",
    NO_ASSIGNMENTS: "NO_ASSIGNMENTS"
});

const getTrimmedMean = (arr) => {
    if (!arr || arr.length === 0) return 0;
    if (arr.length < 10) return arr.reduce((a,b)=>a+b,0) / arr.length;
    const sorted = [...arr].sort((a,b) => a-b);
    const trimCount = Math.floor(sorted.length * 0.1);
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
    if (trimmed.length === 0) return 0;
    return trimmed.reduce((a,b)=>a+b,0) / trimmed.length;
};

export const getAssignmentReviewAnalytics = async (currentUser, assignmentId) => {
    const validAssignmentId = validateId(assignmentId, 'assignment ID');
    const isAdmin = currentUser.role === 'ADMIN';

    const assignmentRes = await pool.query(`
        SELECT c.teacher_id 
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
    `, [validAssignmentId]);

    if (assignmentRes.rowCount === 0) {
        throw new AppError('Assignment not found', 404);
    }
    if (!isAdmin && assignmentRes.rows[0].teacher_id !== currentUser.userId) {
        throw new AppError('Forbidden: You do not have access to this assignment', 403);
    }

    const criteriaRes = await pool.query(`
        SELECT COUNT(*) as total_criteria
        FROM rubric_criteria rc
        JOIN rubrics r ON rc.rubric_id = r.id
        WHERE r.assignment_id = $1
    `, [validAssignmentId]);
    const totalCriteria = parseInt(criteriaRes.rows[0].total_criteria, 10);

    const reviewsRes = await pool.query(`
        SELECT 
            ra.reviewer_group_id,
            ra.status,
            r.overall_comment,
            r.total_score,
            (SELECT COUNT(*) FROM review_criteria rc WHERE rc.review_id = r.id) as criteria_scored,
            (SELECT stddev_pop(rc.score) FROM review_criteria rc WHERE rc.review_id = r.id) as score_stddev
        FROM review_assignments ra
        JOIN submissions s ON ra.submission_id = s.id
        LEFT JOIN reviews r ON r.review_assignment_id = ra.id
        WHERE s.assignment_id = $1
    `, [validAssignmentId]);

    const reviewerMap = new Map();
    reviewsRes.rows.forEach(row => {
        if (!reviewerMap.has(row.reviewer_group_id)) {
            reviewerMap.set(row.reviewer_group_id, {
                groupId: row.reviewer_group_id,
                assignedCount: 0,
                completedCount: 0,
                scoresGiven: [],
                qualities: [],
                rubricScores: [],
                feedbackScores: [],
                varianceScores: []
            });
        }
        
        const reviewer = reviewerMap.get(row.reviewer_group_id);
        reviewer.assignedCount++;
        
        if (row.status === 'COMPLETED') {
            reviewer.completedCount++;
            
            const totalScore = parseFloat(row.total_score) || 0;
            reviewer.scoresGiven.push(totalScore);
            
            let rubricScore = 0;
            if (totalCriteria > 0) {
                const scored = parseInt(row.criteria_scored, 10) || 0;
                rubricScore = Math.min(1, scored / totalCriteria);
            }
            
            let feedbackScore = 0;
            if (row.overall_comment) {
                const words = row.overall_comment.trim().split(/\s+/);
                const uniqueWords = new Set(words);
                if (row.overall_comment.length >= 20 && words.length >= 3 && uniqueWords.size >= 3) {
                    feedbackScore = Math.min(1, Math.max(0, (row.overall_comment.length - 20) / 80));
                }
            }
            
            const std = parseFloat(row.score_stddev) || 0;
            const MAX_SCORE = 100;
            const MIN_SCORE = 0;
            const maxStd = (MAX_SCORE - MIN_SCORE) / 2;
            let varianceScore = 0;
            if (totalCriteria < 3) {
                varianceScore = 0.5; // neutral
            } else if (maxStd > 0) {
                varianceScore = Math.min(1, std / maxStd);
            }
            
            const quality = (0.4 * rubricScore) + (0.3 * feedbackScore) + (0.3 * varianceScore);
            reviewer.qualities.push(quality);
            reviewer.rubricScores.push(rubricScore);
            reviewer.feedbackScores.push(feedbackScore);
            reviewer.varianceScores.push(varianceScore);
        }
    });

    const result = Array.from(reviewerMap.values()).map(reviewer => {
        const completionRate = reviewer.assignedCount > 0 ? (reviewer.completedCount / reviewer.assignedCount) * 100 : 0;
        let averageScoreGiven = 0;
        let avgReviewQuality = 0;
        let avgRubric = 0, avgFeedback = 0, avgVariance = 0;
        
        const capped = Math.min(reviewer.completedCount, 20);
        const confidence = 1 - Math.exp(-capped / 5);
        
        if (reviewer.completedCount > 0) {
            averageScoreGiven = getTrimmedMean(reviewer.scoresGiven);
            avgReviewQuality = getTrimmedMean(reviewer.qualities);
            avgRubric = getTrimmedMean(reviewer.rubricScores);
            avgFeedback = getTrimmedMean(reviewer.feedbackScores);
            avgVariance = getTrimmedMean(reviewer.varianceScores);
        }
        
        const isLowQuality = reviewer.completedCount > 0 ? avgReviewQuality < 0.3 : false;
        const isRiskyReviewer = reviewer.completedCount >= 5 && (avgReviewQuality < 0.3 && confidence > 0.5);
        
        const hasData = reviewer.completedCount > 0;
        let breakdown = null;
        if (hasData) {
            const recomputed = 0.4 * avgRubric + 0.3 * avgFeedback + 0.3 * avgVariance;
            if (Math.abs(recomputed - avgReviewQuality) > 0.01) {
                if (Math.random() < 0.1) {
                    logger.warn({
                        event: "quality_mismatch",
                        assignmentId,
                        reviewerGroupId: reviewer.groupId,
                        expected: avgReviewQuality,
                        recomputed
                    });
                }
            }
            breakdown = {
                rubric: round2(avgRubric),
                feedback: round2(avgFeedback),
                variance: round2(avgVariance)
            };
        }
        
        const completionRatePctValue = reviewer.assignedCount === 0 ? null : round2(Math.max(0, Math.min(100, completionRate)));
        const completionRateReason = reviewer.assignedCount === 0 ? NO_DATA_REASONS.NO_ASSIGNMENTS : null;
        
        let hasDataReason = null;
        if (!hasData) {
            hasDataReason = reviewer.assignedCount > 0 ? NO_DATA_REASONS.HAS_PENDING_REVIEWS : NO_DATA_REASONS.NO_ASSIGNMENTS;
        }

        return {
            groupId: reviewer.groupId,
            hasData,
            hasDataReason,
            assignedCount: reviewer.assignedCount,
            completedCount: reviewer.completedCount,
            completionRatePct: completionRatePctValue,
            completionRateReason,
            averageScoreGiven: hasData ? round2(averageScoreGiven) : null,
            qualityScore: hasData ? round2(avgReviewQuality) : null,
            trustedQuality: hasData ? round2(avgReviewQuality * (0.5 + 0.5 * confidence)) : null,
            confidenceScore: round2(confidence),
            breakdown,
            isLowQuality,
            isRiskyReviewer
        };
    });

    const totalAssignmentScores = result.reduce((acc, r) => acc + (r.averageScoreGiven * r.completedCount), 0);
    const totalAssignmentCompleted = result.reduce((acc, r) => acc + r.completedCount, 0);
    const globalAverageScore = totalAssignmentCompleted > 0 ? totalAssignmentScores / totalAssignmentCompleted : 0;

    result.forEach(r => {
        const biasRaw = r.averageScoreGiven - globalAverageScore;
        const scoreRange = 100; // Assuming MAX=100 MIN=0
        const bias = r.completedCount > 0 && scoreRange > 0 ? biasRaw / scoreRange : 0;
        const biasScoreNormalized = Math.max(-1, Math.min(1, bias));
        r.biasScoreNormalized = round2(biasScoreNormalized);
        const EPS = 0.05;
        r.isLenient = biasScoreNormalized > EPS;
        r.isHarsh = biasScoreNormalized < -EPS;
    });

    result.sort((a, b) => {
        if (a.isLowQuality !== b.isLowQuality) {
            return a.isLowQuality ? -1 : 1;
        }
        if (a.trustedQuality !== b.trustedQuality) {
            return (a.trustedQuality || 0) - (b.trustedQuality || 0);
        }
        return (a.groupId || '').localeCompare(b.groupId || '', undefined, { numeric: true });
    });

    return {
        metricsVersion: "v1",
        generatedAt: new Date().toISOString(),
        scoring: {
            weights: { rubric: 0.4, feedback: 0.3, variance: 0.3 }
        },
        assignmentId,
        totalReviewers: result.length,
        reviewers: result
    };
};

export const getClassReviewAnalytics = async (currentUser, classId) => {
    const validClassId = validateId(classId, 'class ID');
    const isAdmin = currentUser.role === 'ADMIN';

    const classRes = await pool.query(`SELECT teacher_id FROM classes WHERE id = $1`, [validClassId]);
    if (classRes.rowCount === 0) {
        throw new AppError('Class not found', 404);
    }
    if (!isAdmin && classRes.rows[0].teacher_id !== currentUser.userId) {
        throw new AppError('Forbidden: You do not have access to this class', 403);
    }

    const criteriaRes = await pool.query(`
        SELECT r.assignment_id, COUNT(rc.id) as total_criteria
        FROM rubric_criteria rc
        JOIN rubrics r ON rc.rubric_id = r.id
        WHERE r.assignment_id IN (SELECT id FROM assignments WHERE class_id = $1)
        GROUP BY r.assignment_id
    `, [classId]);
    
    const criteriaMap = new Map();
    criteriaRes.rows.forEach(row => {
        criteriaMap.set(row.assignment_id, parseInt(row.total_criteria, 10));
    });
    
    const reviewsRes = await pool.query(`
        SELECT 
            s.assignment_id,
            ra.reviewer_group_id,
            ra.status,
            r.overall_comment,
            r.total_score,
            (SELECT COUNT(*) FROM review_criteria rc WHERE rc.review_id = r.id) as criteria_scored,
            (SELECT stddev_pop(rc.score) FROM review_criteria rc WHERE rc.review_id = r.id) as score_stddev
        FROM review_assignments ra
        JOIN submissions s ON ra.submission_id = s.id
        LEFT JOIN reviews r ON r.review_assignment_id = ra.id
        WHERE s.assignment_id IN (SELECT id FROM assignments WHERE class_id = $1)
    `, [classId]);
    
    const assignmentMap = new Map();
    
    reviewsRes.rows.forEach(row => {
        if (!assignmentMap.has(row.assignment_id)) {
            assignmentMap.set(row.assignment_id, {
                assignmentId: row.assignment_id,
                reviewers: new Map()
            });
        }
        
        const assignment = assignmentMap.get(row.assignment_id);
        const reviewerMap = assignment.reviewers;
        
        if (!reviewerMap.has(row.reviewer_group_id)) {
            reviewerMap.set(row.reviewer_group_id, {
                assignedCount: 0,
                completedCount: 0,
                scoresGiven: [],
                qualities: []
            });
        }
        
        const reviewer = reviewerMap.get(row.reviewer_group_id);
        reviewer.assignedCount++;
        
        if (row.status === 'COMPLETED') {
            reviewer.completedCount++;
            reviewer.scoresGiven.push(parseFloat(row.total_score) || 0);
            
            const totalCriteria = criteriaMap.get(row.assignment_id) || 0;
            let rubricScore = 0;
            if (totalCriteria > 0) {
                const scored = parseInt(row.criteria_scored, 10) || 0;
                rubricScore = Math.min(1, scored / totalCriteria);
            }
            
            let feedbackScore = 0;
            if (row.overall_comment) {
                const words = row.overall_comment.trim().split(/\s+/);
                const uniqueWords = new Set(words);
                if (row.overall_comment.length >= 20 && words.length >= 3 && uniqueWords.size >= 3) {
                    feedbackScore = Math.min(1, Math.max(0, (row.overall_comment.length - 20) / 80));
                }
            }
            
            const std = parseFloat(row.score_stddev) || 0;
            const MAX_SCORE = 100;
            const MIN_SCORE = 0;
            const maxStd = (MAX_SCORE - MIN_SCORE) / 2;
            let varianceScore = 0;
            if (totalCriteria < 3) {
                varianceScore = 0.5; // neutral
            } else if (maxStd > 0) {
                varianceScore = Math.min(1, std / maxStd);
            }
            
            const quality = (0.4 * rubricScore) + (0.3 * feedbackScore) + (0.3 * varianceScore);
            reviewer.qualities.push(quality);
        }
    });

    const result = [];
    assignmentMap.forEach((assignment, assignmentId) => {
        let totalAssigned = 0;
        let totalCompleted = 0;
        let allScores = [];
        let allQualities = [];
        let hasLowQualityReview = false;
        
        assignment.reviewers.forEach(reviewer => {
            totalAssigned += reviewer.assignedCount;
            totalCompleted += reviewer.completedCount;
            
            if (reviewer.completedCount > 0) {
                allScores.push(...reviewer.scoresGiven);
                allQualities.push(...reviewer.qualities);
                
                const avgQuality = reviewer.qualities.reduce((a,b)=>a+b, 0) / reviewer.completedCount;
                if (avgQuality < 0.3) {
                    hasLowQualityReview = true;
                }
            }
        });
        
        const reviewCompletionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;
        const averageScore = getTrimmedMean(allScores);
        const avgReviewQuality = getTrimmedMean(allQualities);
        
        const hasData = allScores.length > 0;
        const hasEnoughData = allScores.length >= 10;
        let medianScore = 0;
        let scoreStdDev = 0;
        let q1Score = 0;
        let q3Score = 0;
        let p10Score = 0;
        let p90Score = 0;
        let iqr = 0;
        let isUniformScoring = false;
        let isSingleBucket = false;
        
        // TODO: dynamic buckets based on scoreRange
        let scoreDistribution = { "0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0 };
        
        if (hasData) {
            const sortedScores = [...allScores].sort((a,b) => a-b);
            const mid = Math.floor(sortedScores.length / 2);
            medianScore = sortedScores.length % 2 !== 0 ? sortedScores[mid] : (sortedScores[mid - 1] + sortedScores[mid]) / 2;
            
            q1Score = sortedScores[Math.floor(sortedScores.length * 0.25)];
            q3Score = sortedScores[Math.floor(sortedScores.length * 0.75)];
            iqr = q3Score - q1Score;
            
            p10Score = sortedScores[Math.floor(sortedScores.length * 0.1)];
            p90Score = sortedScores[Math.floor(sortedScores.length * 0.9)];
            
            const meanScore = allScores.reduce((a,b)=>a+b, 0) / allScores.length;
            const variance = allScores.reduce((acc, val) => acc + Math.pow(val - meanScore, 2), 0) / allScores.length;
            scoreStdDev = Math.sqrt(variance);
            isUniformScoring = scoreStdDev === 0 && allScores.length >= 3;
            
            // TODO: dynamic buckets based on scoreRange
            allScores.forEach(s => {
                const s100 = (s / 100) * 100; // assuming scale 100
                if (s100 <= 20) scoreDistribution["0-20"]++;
                else if (s100 <= 40) scoreDistribution["20-40"]++;
                else if (s100 <= 60) scoreDistribution["40-60"]++;
                else if (s100 <= 80) scoreDistribution["60-80"]++;
                else scoreDistribution["80-100"]++;
            });
            isSingleBucket = Object.values(scoreDistribution).filter(v => v > 0).length === 1;
        }
        
        const completionRatePctValue = totalAssigned === 0 ? null : round2(Math.max(0, Math.min(100, reviewCompletionRate)));
        const completionRateReason = totalAssigned === 0 ? NO_DATA_REASONS.NO_ASSIGNMENTS : null;
        
        let hasDataReason = null;
        if (!hasData) {
            hasDataReason = totalAssigned > 0 ? NO_DATA_REASONS.HAS_PENDING_REVIEWS : NO_DATA_REASONS.NO_ASSIGNMENTS;
        }
        const avgReviewsPerReviewer = assignment.reviewers.length > 0 ? round2(totalCompleted / assignment.reviewers.length) : 0;
        
        result.push({
            assignmentId,
            hasData,
            hasDataReason,
            reviewCompletionRatePct: completionRatePctValue,
            reviewCompletionRateReason: completionRateReason,
            averageScore: hasData ? round2(averageScore) : null,
            medianScore: hasData ? round2(medianScore) : null,
            q1Score: hasEnoughData ? round2(q1Score) : null,
            q3Score: hasEnoughData ? round2(q3Score) : null,
            iqr: hasEnoughData ? round2(iqr) : null,
            p10Score: hasEnoughData ? round2(p10Score) : null,
            p90Score: hasEnoughData ? round2(p90Score) : null,
            percentileAvailable: hasEnoughData,
            percentileReason: hasData && !hasEnoughData ? "INSUFFICIENT_SAMPLE" : null,
            percentileSampleSize: hasData ? allScores.length : 0,
            scoreSampleSize: hasData ? allScores.length : 0,
            scoreStdDev: hasData ? round2(scoreStdDev) : null,
            isUniformScoring,
            scoreDistribution: hasData ? scoreDistribution : null,
            isSingleBucket,
            reviewerCount: assignment.reviewers.length,
            avgReviewsPerReviewer,
            qualityScore: hasData ? round2(avgReviewQuality) : null,
            hasLowQualityReview
        });
    });

    return {
        metricsVersion: "v1",
        generatedAt: new Date().toISOString(),
        scoring: {
            weights: { rubric: 0.4, feedback: 0.3, variance: 0.3 }
        },
        classId,
        assignments: result
    };
};

export const getCollaborationRisks = async (currentUser, classId) => {
    const validClassId = validateId(classId, 'class ID');
    const isAdmin = currentUser.role === 'ADMIN';

    // 1. Validate ownership
    const classRes = await pool.query(`SELECT teacher_id FROM classes WHERE id = $1`, [validClassId]);
    if (classRes.rowCount === 0) {
        throw new AppError('Class not found', 404);
    }
    if (!isAdmin && classRes.rows[0].teacher_id !== currentUser.userId) {
        throw new AppError('Forbidden: You do not have access to this class', 403);
    }

    // 2. Fetch all data in parallel
    try {
        const [
            groupsRes,
            membersRes,
            activitiesRes,
            tasksRes,
            tasksCreatedRes,
            assignmentsRes,
            reviewsRes
        ] = await Promise.all([
        pool.query(`SELECT id, name, created_at FROM groups WHERE class_id = $1`, [classId]),
        pool.query(`
            SELECT gm.group_id, gm.user_id, u.full_name as name 
            FROM group_members gm 
            JOIN users u ON gm.user_id = u.id 
            JOIN groups g ON gm.group_id = g.id 
            WHERE g.class_id = $1
        `, [classId]),
        pool.query(`
            SELECT al.group_id, al.user_id, COUNT(*) as action_count 
            FROM activity_logs al 
            JOIN groups g ON al.group_id = g.id 
            WHERE g.class_id = $1 
            GROUP BY al.group_id, al.user_id
        `, [classId]),
        pool.query(`
            SELECT t.group_id, t.assignee_id, t.status 
            FROM tasks t 
            JOIN groups g ON t.group_id = g.id 
            WHERE g.class_id = $1
        `, [classId]),
        pool.query(`
            SELECT al.group_id, al.user_id, COUNT(*) as tasks_created
            FROM activity_logs al
            JOIN groups g ON al.group_id = g.id
            WHERE g.class_id = $1 AND al.action_type LIKE 'TASK_CREATE%'
            GROUP BY al.group_id, al.user_id
        `, [classId]),
        pool.query(`
            SELECT id, title, deadline 
            FROM assignments 
            WHERE class_id = $1
        `, [classId]),
        pool.query(`
            SELECT ra.reviewer_group_id as group_id, ra.status 
            FROM review_assignments ra 
            JOIN submissions s ON ra.submission_id = s.id 
            JOIN assignments a ON s.assignment_id = a.id 
            WHERE a.class_id = $1
        `, [classId])
    ]);

    // 3. Process data in memory (O(1) lookup)
    const groupsMap = new Map();
    
    groupsRes.rows.forEach(g => {
        groupsMap.set(g.id, {
            group: g,
            members: new Map(),
            totalActivities: 0,
            totalTasks: 0,
            completedTasks: 0,
            totalReviews: 0,
            completedReviews: 0
        });
    });

    membersRes.rows.forEach(m => {
        const groupData = groupsMap.get(m.group_id);
        if (groupData) {
            groupData.members.set(m.user_id, {
                userId: m.user_id,
                name: m.name,
                totalActivities: 0,
                tasksAssigned: 0,
                tasksCompleted: 0,
                tasksCreated: 0
            });
        }
    });

    activitiesRes.rows.forEach(a => {
        const groupData = groupsMap.get(a.group_id);
        if (groupData) {
            const count = parseInt(a.action_count, 10);
            groupData.totalActivities += count;
            const member = groupData.members.get(a.user_id);
            if (member) member.totalActivities = count;
        }
    });

    tasksRes.rows.forEach(t => {
        const groupData = groupsMap.get(t.group_id);
        if (groupData) {
            groupData.totalTasks++;
            if (t.status === 'DONE') groupData.completedTasks++;
            
            if (t.assignee_id) {
                const member = groupData.members.get(t.assignee_id);
                if (member) {
                    member.tasksAssigned++;
                    if (t.status === 'DONE') member.tasksCompleted++;
                }
            }
        }
    });

    tasksCreatedRes.rows.forEach(t => {
        const groupData = groupsMap.get(t.group_id);
        if (groupData) {
            const member = groupData.members.get(t.user_id);
            if (member) {
                member.tasksCreated = parseInt(t.tasks_created, 10) || 0;
            }
        }
    });

    reviewsRes.rows.forEach(r => {
        const groupData = groupsMap.get(r.group_id);
        if (groupData) {
            groupData.totalReviews++;
            if (r.status === 'COMPLETED') groupData.completedReviews++;
        }
    });

    const assignments = assignmentsRes.rows;
    const now = new Date();
    
    let nearestDeadlineDays = Infinity;
    let isReviewPhaseStarted = false;
    assignments.forEach(a => {
        const deadlineDate = new Date(a.deadline);
        const diffDays = (deadlineDate - now) / (1000 * 60 * 60 * 24);
        
        if (diffDays <= 2 && diffDays > -30) {
            if (diffDays < nearestDeadlineDays) nearestDeadlineDays = diffDays;
        }
        
        if (now > deadlineDate) {
            isReviewPhaseStarted = true;
        }
    });

    // 4. Rule Engine
    const riskTemplates = {
        DEAD_GROUP: (groupName) => `Nhóm ${groupName} không có bất kỳ hoạt động nào`,
        LOW_ACTIVITY: (name) => `${name} không có tương tác nào trong nhóm`,
        LOW_CONTRIBUTION: (name) => `${name} có mức đóng góp quá thấp`,
        UNBALANCED_CONTRIBUTION: (groupName) => `Phân chia công việc trong nhóm ${groupName} quá mất cân bằng`,
        INCOMPLETE_TASKS: (groupName) => `Nhóm ${groupName} hoàn thành quá ít task trong khi sắp tới deadline`,
        REVIEW_INACTIVITY_HIGH: (groupName) => `Nhóm ${groupName} chưa chấm chéo bài nào`,
        REVIEW_INACTIVITY_MEDIUM: (groupName) => `Nhóm ${groupName} chậm trễ trong việc chấm chéo`
    };

    const rules = [
        // 1. DEAD_GROUP
        (g) => {
            const ageInDays = (now - new Date(g.group.created_at)) / (1000 * 60 * 60 * 24);
            if (g.totalActivities === 0 && ageInDays > 2) {
                return { type: 'DEAD_GROUP', entity: 'GROUP', severity: 'HIGH', data: { ageInDays: round2(ageInDays) } };
            }
            return null;
        },
        // 2. LOW_ACTIVITY
        (g) => {
            if (g.isDeadGroup) return null;
            if (g.totalActivities <= 5) return null;
            
            const results = [];
            g.members.forEach(m => {
                if (m.totalActivities === 0) {
                    results.push({ type: 'LOW_ACTIVITY', entity: 'USER', severity: 'MEDIUM', userId: m.userId, userName: m.name, data: { groupActivities: g.totalActivities } });
                }
            });
            return results;
        },
        // 3. LOW_CONTRIBUTION
        (g) => {
            if (g.isDeadGroup) return null;
            
            const results = [];
            g.members.forEach(m => {
                if (m.metrics && m.metrics.isFreeRider) {
                    results.push({ type: 'LOW_CONTRIBUTION', entity: 'USER', severity: 'HIGH', userId: m.userId, userName: m.name, data: { contributionScore: m.metrics.contributionScore } });
                }
            });
            return results;
        },
        // 4. UNBALANCED_CONTRIBUTION
        (g) => {
            if (g.isDeadGroup) return null;
            if (g.members.size < 2 || g.totalTasks < 5) return null;
            
            let maxContribution = 0;
            g.members.forEach(m => {
                if (m.metrics && m.metrics.contributionScore > maxContribution) {
                    maxContribution = m.metrics.contributionScore;
                }
            });
            
            if (maxContribution > 0.8) {
                return { type: 'UNBALANCED_CONTRIBUTION', entity: 'GROUP', severity: 'MEDIUM', data: { maxContribution } };
            }
            return null;
        },
        // 5. INCOMPLETE_TASKS
        (g) => {
            if (g.isDeadGroup) return null;
            if (g.totalTasks > 0 && nearestDeadlineDays <= 2) {
                const completionRate = g.completedTasks / g.totalTasks;
                if (completionRate < 0.3) {
                    return { type: 'INCOMPLETE_TASKS', entity: 'GROUP', severity: 'HIGH', data: { completionRate: round2(completionRate), daysToDeadline: round2(nearestDeadlineDays) } };
                }
            }
            return null;
        },
        // 6. REVIEW_INACTIVITY
        (g) => {
            if (g.totalReviews > 0 && isReviewPhaseStarted) {
                const reviewCompletionRate = g.completedReviews / g.totalReviews;
                if (reviewCompletionRate === 0) {
                    return { type: 'REVIEW_INACTIVITY', entity: 'GROUP', severity: 'HIGH', data: { reviewCompletionRate: 0 } };
                } else if (reviewCompletionRate < 0.5) {
                    return { type: 'REVIEW_INACTIVITY', entity: 'GROUP', severity: 'MEDIUM', data: { reviewCompletionRate: round2(reviewCompletionRate) } };
                }
            }
            return null;
        }
    ];

    const formatRisk = (res, g) => {
        let score = res.severity === 'HIGH' ? 0.9 : 0.6;
        let description = "";
        
        switch (res.type) {
            case 'DEAD_GROUP': description = riskTemplates.DEAD_GROUP(g.group.name); break;
            case 'LOW_ACTIVITY': description = riskTemplates.LOW_ACTIVITY(res.userName); break;
            case 'LOW_CONTRIBUTION': description = riskTemplates.LOW_CONTRIBUTION(res.userName); break;
            case 'UNBALANCED_CONTRIBUTION': description = riskTemplates.UNBALANCED_CONTRIBUTION(g.group.name); break;
            case 'INCOMPLETE_TASKS': description = riskTemplates.INCOMPLETE_TASKS(g.group.name); break;
            case 'REVIEW_INACTIVITY': 
                description = res.severity === 'HIGH' ? riskTemplates.REVIEW_INACTIVITY_HIGH(g.group.name) : riskTemplates.REVIEW_INACTIVITY_MEDIUM(g.group.name);
                break;
        }

        return {
            id: `risk-${g.group.id}-${res.userId || 'group'}-${res.type}`,
            groupId: g.group.id,
            groupName: g.group.name,
            userId: res.userId || null,
            userName: res.userName || null,
            entityType: res.entity,
            riskType: res.type,
            severity: res.severity,
            score,
            message: description,
            description,
            data: res.data || {}
        };
    };

    const risks = [];
    const uniqueRisks = new Set();

    groupsMap.forEach(g => {
        // Pre-calculate member metrics
        const maxActivities = Math.max(0, ...Array.from(g.members.values()).map(m => m.totalActivities));
        const maxTasksCreated = Math.max(0, ...Array.from(g.members.values()).map(m => m.tasksCreated));
        
        g.members.forEach(m => {
            m.metrics = calculateContribution(m, maxActivities, maxTasksCreated);
        });

        // Determine if dead group
        const ageInDays = (now - new Date(g.group.created_at)) / (1000 * 60 * 60 * 24);
        g.isDeadGroup = (g.totalActivities === 0 && ageInDays > 2);

        rules.forEach(rule => {
            const results = rule(g);
            const arr = Array.isArray(results) ? results : (results ? [results] : []);
            
            arr.forEach(res => {
                const key = `${g.group.id}-${res.userId || 'group'}-${res.type}`;
                if (!uniqueRisks.has(key)) {
                    uniqueRisks.add(key);
                    risks.push(formatRisk(res, g));
                }
            });
        });
    });

        risks.sort((a, b) => b.score - a.score);

        const finalRisks = risks.slice(0, 50);

        logger.info({
            event: 'collab_risk_result',
            classId,
            totalRisks: finalRisks.length,
            rawRisks: risks.length
        });

        return finalRisks;
    } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error({ event: 'collab_risk_error', classId, error: err.message });
        return [];
    }
};
