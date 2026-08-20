import * as workspaceService from '../services/workspace.service.js';
import { isValidUUID, isValidString } from '../utils/validation.util.js';

export const getDiscussions = async (req, res) => {
    try {
        const { id: groupId } = req.params;

        if (!isValidUUID(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        const discussions = await workspaceService.getDiscussions(groupId);
        
        res.status(200).json({ data: discussions });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createDiscussion = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { message } = req.body;

        if (!isValidUUID(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        if (!isValidString(message, 5000)) {
            return res.status(400).json({ message: 'Message is required and must not exceed 5000 characters' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        
        const userId = req.user.userId;
        const newDiscussion = await workspaceService.createDiscussion(groupId, userId, message.trim());
        
        res.status(201).json({ data: newDiscussion });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
