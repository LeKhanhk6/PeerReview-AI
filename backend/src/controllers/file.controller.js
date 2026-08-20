import * as workspaceService from '../services/workspace.service.js';
import { isValidUUID, isValidString, isValidHttpUrl } from '../utils/validation.util.js';

export const getFiles = async (req, res) => {
    try {
        const { id: groupId } = req.params;

        if (!isValidUUID(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        const files = await workspaceService.getFiles(groupId);
        
        res.status(200).json({ data: files });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createFile = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { file_name, file_url } = req.body;

        if (!isValidUUID(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        if (!isValidString(file_name, 255)) {
            return res.status(400).json({ message: 'File name is required and must not exceed 255 characters' });
        }

        if (!isValidString(file_url, 2048) || !isValidHttpUrl(file_url.trim())) {
            return res.status(400).json({ message: 'A valid absolute HTTP/HTTPS file URL is required' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        
        const userId = req.user.userId;
        const newFile = await workspaceService.createFile(groupId, userId, file_name.trim(), file_url.trim());
        
        res.status(201).json({ data: newFile });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
