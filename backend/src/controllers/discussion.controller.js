import * as workspaceService from '../services/workspace.service.js';
import { AppError } from '../utils/AppError.js';

export const getDiscussions = async (req, res, next) => {
    try {
        const { id: groupId } = req.params;

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        const discussions = await workspaceService.getDiscussions(groupId);
        
        return res.ok(discussions);
    } catch (error) {
        next(error);
    }
};

export const createDiscussion = async (req, res, next) => {
    try {
        const { id: groupId } = req.params;
        const { message } = req.body;
        const userId = req.user?.id;

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        
        const newDiscussion = await workspaceService.createDiscussion(groupId, userId, message.trim());
        
        return res.ok(newDiscussion, 201);
    } catch (error) {
        next(error);
    }
};
