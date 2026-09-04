import * as activityService from '../services/activity.service.js';
import * as workspaceService from '../services/workspace.service.js';
import { AppError } from '../utils/AppError.js';

export const getActivities = async (req, res, next) => {
    try {
        const { id: groupId } = req.params;
        const { limit, offset, page } = req.pagination;

        // Validate access
        await workspaceService.checkWorkspaceAccess(groupId, req.user);

        const activities = await activityService.getGroupActivities(groupId, limit, offset);
        
        return res.paginate(activities.data, {
            page,
            limit,
            hasNext: activities.hasNext
        });
    } catch (error) {
        next(error);
    }
};
