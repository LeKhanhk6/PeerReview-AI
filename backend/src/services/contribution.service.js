import pool from '../config/db.js';
import { getGroupActivityStats } from './activity.service.js';
import { CONTRIBUTION_WEIGHTS, CONTRIBUTION_CAPS, CONTRIBUTION_THRESHOLDS } from '../constants/index.js';

/**
 * Calculates the contribution scores for all members of a group within a timeframe.
 * @param {string} groupId - The ID of the group.
 * @param {object} timeframe - { from, to } date strings or objects.
 * @returns {Promise<Array>} List of member contribution reports.
 */
export const calculateGroupContributions = async (groupId, timeframe) => {
    // 1. Fetch raw stats and all members
    const [stats, membersRes] = await Promise.all([
        getGroupActivityStats(groupId, timeframe),
        pool.query('SELECT user_id FROM group_members WHERE group_id = $1', [groupId])
    ]);

    // Calculate days in timeframe for caps
    let days = 30; // Default
    if (timeframe && timeframe.from && timeframe.to) {
        const ms = new Date(timeframe.to).getTime() - new Date(timeframe.from).getTime();
        if (ms > 0) days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    }

    // 2. Aggregate raw scores per user
    const userScores = new Map();
    
    // Pre-fill with all members to avoid missing free-riders
    for (const row of membersRes.rows) {
        userScores.set(row.user_id, {
            userId: row.user_id,
            rawScore: 0,
            breakdown: {}
        });
    }
    
    for (const stat of stats) {
        const userId = stat.user_id;
        const actionType = stat.action_type;
        const uniqueActions = parseInt(stat.unique_actions, 10);
        
        if (!userScores.has(userId)) {
            userScores.set(userId, {
                userId,
                rawScore: 0,
                breakdown: {}
            });
        }
        
        const userData = userScores.get(userId);
        
        const weight = CONTRIBUTION_WEIGHTS[actionType] || 0;
        const capPerDay = CONTRIBUTION_CAPS[actionType] || Infinity;
        const totalCap = capPerDay === Infinity ? Infinity : capPerDay * days;
        
        // Anti-spam: Apply cap per activity type based on timeframe
        const effectiveActions = Math.min(uniqueActions, totalCap);
        const scoreEarned = effectiveActions * weight;
        
        userData.rawScore += scoreEarned;
        if (!userData.breakdown[actionType]) {
            userData.breakdown[actionType] = {
                totalActions: 0,
                uniqueActions: 0,
                effectiveActions: 0,
                weight,
                scoreEarned: 0
            };
        }
        
        const bd = userData.breakdown[actionType];
        bd.totalActions += parseInt(stat.total, 10);
        bd.uniqueActions += uniqueActions;
        bd.effectiveActions += effectiveActions;
        bd.scoreEarned += scoreEarned;
    }

    // 3. Normalization (Scale to 0-100 relative to the highest contributor)
    const members = Array.from(userScores.values());
    
    let maxRawScore = 0;
    let totalGroupRawScore = 0;
    for (const member of members) {
        if (member.rawScore > maxRawScore) {
            maxRawScore = member.rawScore;
        }
        totalGroupRawScore += member.rawScore;
    }

    // Relative scaling bug fix: if maxRawScore is too low (e.g., group just started),
    // don't inflate someone with 5 points to 100 points (HIGH_CONTRIBUTOR).
    const scaleDenominator = Math.max(maxRawScore, CONTRIBUTION_THRESHOLDS.MIN_RAW_SCORE_FOR_SCALE || 20);

    // 4. Scoring & Classification
    const result = members.map(member => {
        let finalScore = 0;
        if (member.rawScore > 0) {
            finalScore = Math.round((member.rawScore / scaleDenominator) * 100);
        }
        
        let contributionPercent = 0;
        if (totalGroupRawScore > 0) {
            contributionPercent = parseFloat(((member.rawScore / totalGroupRawScore) * 100).toFixed(2));
        }

        const activityTypesCount = Object.keys(member.breakdown).length;

        let classification = 'FREE_RIDER';
        if (finalScore >= CONTRIBUTION_THRESHOLDS.HIGH) {
            // Enforce diversity check: prevent spamming 1 activity type to get HIGH
            classification = activityTypesCount >= 2 ? 'HIGH_CONTRIBUTOR' : 'NORMAL_CONTRIBUTOR';
        } else if (finalScore >= CONTRIBUTION_THRESHOLDS.NORMAL) {
            classification = 'NORMAL_CONTRIBUTOR';
        } else if (finalScore >= CONTRIBUTION_THRESHOLDS.LOW) {
            classification = 'LOW_CONTRIBUTOR';
        }

        // Stricter Free-rider check
        if (member.rawScore === 0 || (member.rawScore < 5 && activityTypesCount === 0)) {
            classification = 'FREE_RIDER';
        }

        const alerts = [];
        if (classification === 'FREE_RIDER') {
            alerts.push('Potential free-rider detected based on extremely low activity score.');
        }

        return {
            userId: member.userId,
            rawScore: member.rawScore,
            finalScore,
            contributionPercent,
            classification,
            alerts,
            breakdown: member.breakdown
        };
    });

    // Sort by final score descending
    result.sort((a, b) => b.finalScore - a.finalScore);

    return result;
};

/**
 * NEW: Expanded MVP - Group Internal Evaluation Algorithm (C1, C2, C3, C4)
 */

export const calculateC1 = async (groupId, userId, groupSize = 1) => {
    // 1. Task Ratio
    const allGroupTasksRes = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE group_id = $1', [groupId]);
    const groupHasTasks = parseInt(allGroupTasksRes.rows[0].count, 10) > 0;

    const taskRes = await pool.query('SELECT status FROM tasks WHERE group_id = $1 AND assignee_id = $2', [groupId, userId]);
    const totalTasks = taskRes.rows.length;
    const doneTasks = taskRes.rows.filter(t => t.status === 'DONE').length;
    
    let taskRatio = 0;
    if (totalTasks > 0) {
        taskRatio = doneTasks / totalTasks;
    } else if (!groupHasTasks) {
        // Nhóm không dùng task -> Mặc định neutral (1.0) để không bị kéo điểm
        taskRatio = 1.0;
    }

    // 2. Activity Ratio
    const groupActRes = await pool.query('SELECT user_id, COUNT(*) as count FROM activity_logs WHERE group_id = $1 GROUP BY user_id', [groupId]);
    let groupTotalAct = 0;
    let userAct = 0;
    for (const row of groupActRes.rows) {
        const cnt = parseInt(row.count, 10);
        groupTotalAct += cnt;
        if (row.user_id === userId) {
            userAct = cnt;
        }
    }
    
    // Normalization: Nếu làm đúng phần của mình (1/groupSize) -> được 100% (1.0)
    let actRatio = 0;
    if (groupTotalAct > 0) {
        actRatio = Math.min(1.0, (userAct / groupTotalAct) * groupSize);
    }

    // C1 is 0-100 scale
    let c1 = 0;
    if (!groupHasTasks && groupTotalAct === 0) {
        c1 = 0; // Nhóm hoàn toàn inactive
    } else if (!groupHasTasks) {
        c1 = actRatio * 100; // Nhóm không dùng task -> 100% dựa vào activity
    } else {
        c1 = (0.7 * taskRatio + 0.3 * actRatio) * 100;
    }
    
    return Math.round(c1);
};

export const calculateAssignmentContributions = async (assignmentId, groupId) => {
    // 1. Get all members
    const membersRes = await pool.query('SELECT user_id FROM group_members WHERE group_id = $1', [groupId]);
    const members = membersRes.rows.map(r => r.user_id);
    const M = members.length;
    if (M === 0) return [];

    // 2. Get C2, C3, C4 (Averages from internal_evaluations)
    // Only real votes are counted
    const evalsRes = await pool.query(`
        SELECT evaluatee_id, 
               AVG(c2_score) as avg_c2, 
               AVG(c3_score) as avg_c3, 
               AVG(c4_score) as avg_c4,
               COUNT(*) as votes
        FROM internal_evaluations 
        WHERE assignment_id = $1 AND group_id = $2
        GROUP BY evaluatee_id
    `, [assignmentId, groupId]);

    const evalMap = new Map();
    for (const row of evalsRes.rows) {
        evalMap.set(row.evaluatee_id, {
            c2: parseFloat(row.avg_c2),
            c3: parseFloat(row.avg_c3),
            c4: parseFloat(row.avg_c4),
            votes: parseInt(row.votes, 10)
        });
    }

    // 3. Calculate S_i for each member
    const results = [];
    let sumS = 0;

    for (const userId of members) {
        const c1 = await calculateC1(groupId, userId, M);
        const evals = evalMap.get(userId) || { c2: 0, c3: 0, c4: 0, votes: 0 };
        
        // S_i formula: 0.35*(C1/100) + 0.30*(C2/5) + 0.20*(C3/5) + 0.15*(C4/5)
        const si = 0.35 * (c1 / 100) + 0.30 * (evals.c2 / 5) + 0.20 * (evals.c3 / 5) + 0.15 * (evals.c4 / 5);
        sumS += si;

        results.push({
            userId,
            c1,
            c2: evals.c2,
            c3: evals.c3,
            c4: evals.c4,
            si,
            votes: evals.votes
        });
    }

    // 4. Calculate G_ind = G_group * (S_i / mean(S))
    const meanS = sumS / M;
    const G_group = 1.0; // Base group score multiplier placeholder, UI expects a multiplier to apply to the real score

    for (const r of results) {
        // Guard mean(S) = 0
        if (meanS === 0) {
            r.multiplier = 1.0; // Everyone gets G_group
        } else {
            r.multiplier = parseFloat((r.si / meanS).toFixed(2));
        }

        // Determine Classification
        if (r.multiplier >= 1.2) r.classification = 'HIGH_CONTRIBUTOR';
        else if (r.multiplier >= 0.8) r.classification = 'NORMAL_CONTRIBUTOR';
        else if (r.multiplier >= 0.5) r.classification = 'LOW_CONTRIBUTOR';
        else r.classification = 'FREE_RIDER';

        if (r.votes === 0) {
            r.classification = 'MISSING_EVALUATION'; // Flag for early warning
        }
    }

    return results;
};

export const publishAssignmentContributions = async (assignmentId, groupId) => {
    const results = await calculateAssignmentContributions(assignmentId, groupId);
    
    // Snapshot into contribution_metrics
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const insertQ = `
            INSERT INTO contribution_metrics 
            (group_id, assignment_id, user_id, contribution_score, classification, metadata, calculated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (assignment_id, group_id, user_id) 
            DO UPDATE SET 
                contribution_score = EXCLUDED.contribution_score,
                classification = EXCLUDED.classification,
                metadata = EXCLUDED.metadata,
                calculated_at = NOW()
        `;

        for (const r of results) {
            const metadata = JSON.stringify({
                c1: r.c1,
                c2: r.c2,
                c3: r.c3,
                c4: r.c4,
                si: r.si,
                votes: r.votes,
                multiplier: r.multiplier
            });
            await client.query(insertQ, [groupId, assignmentId, r.userId, r.multiplier * 100, r.classification, metadata]);
        }
        
        await client.query('COMMIT');
        return results;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const getAssignmentGroupAnalytics = async (assignmentId, groupId) => {
    // 1. Check if snapshot exists
    const snapRes = await pool.query('SELECT * FROM contribution_metrics WHERE assignment_id = $1 AND group_id = $2', [assignmentId, groupId]);
    
    if (snapRes.rowCount > 0) {
        // Return snapshot
        return snapRes.rows.map(r => {
            const meta = r.metadata || {};
            return {
                userId: r.user_id,
                c1: meta.c1 || 0,
                c2: meta.c2 || 0,
                c3: meta.c3 || 0,
                c4: meta.c4 || 0,
                si: meta.si || 0,
                votes: meta.votes || 0,
                multiplier: meta.multiplier || (r.contribution_score / 100),
                classification: r.classification,
                isPublished: true,
                calculatedAt: r.calculated_at
            };
        });
    }

    // 2. If not published, calculate live
    const liveResults = await calculateAssignmentContributions(assignmentId, groupId);
    return liveResults.map(r => ({ ...r, isPublished: false }));
};
