import pool from '../config/db.js';
import { getGroupActivityStats } from './activity.service.js';
import { CONTRIBUTION_WEIGHTS, CONTRIBUTION_CAPS, CONTRIBUTION_THRESHOLDS } from '../utils/constants.js';

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
