import * as activityService from '../services/activity.service.js';
import * as workspaceService from '../services/workspace.service.js';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getActivities = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        let { page, limit } = req.query;

        if (!uuidRegex.test(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        // Validate access
        await workspaceService.checkWorkspaceAccess(groupId, req.user);

        limit = parseInt(limit, 10) || 50;
        page = parseInt(page, 10) || 1;
        if (limit <= 0 || limit > 100) limit = 50;
        if (page <= 0) page = 1;
        const offset = (page - 1) * limit;

        const activities = await activityService.getGroupActivities(groupId, limit, offset);
        
        res.status(200).json(activities);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
