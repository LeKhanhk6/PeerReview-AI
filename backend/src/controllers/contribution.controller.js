import * as contributionService from '../services/contribution.service.js';

export const getGroupContributionReport = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({ error: 'Timeframe query parameters "from" and "to" are required.' });
        }
        
        if (isNaN(new Date(from).getTime()) || isNaN(new Date(to).getTime())) {
            return res.status(400).json({ error: 'Invalid date format for "from" or "to".' });
        }

        const report = await contributionService.calculateGroupContributions(groupId, { from, to });

        res.status(200).json({
            message: 'Contribution report generated successfully',
            data: report
        });
    } catch (error) {
        next(error);
    }
};
