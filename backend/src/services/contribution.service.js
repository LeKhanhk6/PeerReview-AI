import { getGroupActivityStats } from './activity.service.js';
import { CONTRIBUTION_WEIGHTS, CONTRIBUTION_CAPS, CONTRIBUTION_THRESHOLDS } from '../utils/constants.js';

/**
 * Calculates the contribution scores for all members of a group within a timeframe.
 * @param {string} groupId - The ID of the group.
 * @param {object} timeframe - { from, to } date strings or objects.
 * @returns {Promise<Array>} List of member contribution reports.
 */
export const calculateGroupContributions = async (groupId, timeframe) => {
    // 1. Fetch raw stats
    const stats = await getGroupActivityStats(groupId, timeframe);

    // 2. Aggregate raw scores per user
    const userScores = new Map();
    
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
        const cap = CONTRIBUTION_CAPS[actionType] || Infinity;
        
        // Anti-spam: Apply cap per activity type
        const effectiveActions = Math.min(uniqueActions, cap);
        const scoreEarned = effectiveActions * weight;
        
        userData.rawScore += scoreEarned;
        userData.breakdown[actionType] = {
            totalActions: parseInt(stat.total, 10),
            uniqueActions,
            effectiveActions,
            scoreEarned
        };
    }

    // 3. Normalization (Scale to 0-100 relative to the highest contributor)
    const members = Array.from(userScores.values());
    
    let maxRawScore = 0;
    for (const member of members) {
        if (member.rawScore > maxRawScore) {
            maxRawScore = member.rawScore;
        }
    }

    // 4. Scoring & Classification
    const result = members.map(member => {
        let finalScore = 0;
        if (maxRawScore > 0) {
            finalScore = Math.round((member.rawScore / maxRawScore) * 100);
        }

        let classification = 'FREE_RIDER';
        if (finalScore >= CONTRIBUTION_THRESHOLDS.HIGH) {
            classification = 'HIGH_CONTRIBUTOR';
        } else if (finalScore >= CONTRIBUTION_THRESHOLDS.NORMAL) {
            classification = 'NORMAL_CONTRIBUTOR';
        } else if (finalScore >= CONTRIBUTION_THRESHOLDS.LOW) {
            classification = 'LOW_CONTRIBUTOR';
        }

        return {
            userId: member.userId,
            rawScore: member.rawScore,
            finalScore,
            classification,
            breakdown: member.breakdown
        };
    });

    // Sort by final score descending
    result.sort((a, b) => b.finalScore - a.finalScore);

    return result;
};
