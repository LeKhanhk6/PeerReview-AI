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

        limit = Number.isInteger(+limit) ? +limit : PAGINATION.DEFAULT_LIMIT;
        if (limit <= 0 || limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.DEFAULT_LIMIT;

        page = Number.isInteger(+page) ? +page : 1;
        if (page <= 0) page = 1;
        if (page > PAGINATION.MAX_PAGE) page = PAGINATION.MAX_PAGE;

        const offset = (page - 1) * limit;

        const activities = await activityService.getGroupActivities(groupId, limit, offset);
        
        res.status(200).json({ data: activities });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
