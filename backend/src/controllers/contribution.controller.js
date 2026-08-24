import * as contributionService from '../services/contribution.service.js';

export const getGroupContributionReport = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { from, to } = req.query;

        const report = await contributionService.calculateGroupContributions(groupId, { from, to });
        return res.ok(report);
    } catch (error) {
        next(error);
    }
};
