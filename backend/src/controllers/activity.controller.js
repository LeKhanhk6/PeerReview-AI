import * as activityService from '../services/activity.service.js';
import * as workspaceService from '../services/workspace.service.js';
import { isValidUUID } from '../utils/validation.util.js';
import { PAGINATION } from '../utils/constants.js';

export const getActivities = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        let { page, limit } = req.query;

        if (!isValidUUID(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        // Validate access
        await workspaceService.checkWorkspaceAccess(groupId, req.user);

        const limitParsed = parseInt(limit, 10);
        const pageParsed = parseInt(page, 10);

        limit = Number.isInteger(limitParsed) ? limitParsed : PAGINATION.DEFAULT_LIMIT;
        page = Number.isInteger(pageParsed) ? pageParsed : 1;
        
        if (limit <= 0) limit = PAGINATION.DEFAULT_LIMIT;
        if (page <= 0) page = 1;

        limit = Math.min(limit, PAGINATION.MAX_LIMIT);
        page = Math.min(page, PAGINATION.MAX_PAGE);

        const offset = (page - 1) * limit;

        const activities = await activityService.getGroupActivities(groupId, limit, offset);
        
        res.status(200).json({
            data: activities,
            page,
            limit,
            hasNext: activities.length === limit // heuristic, not exact
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
