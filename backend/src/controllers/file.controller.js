import * as workspaceService from '../services/workspace.service.js';
import { AppError } from '../utils/AppError.js';

export const getFiles = async (req, res, next) => {
    try {
        const { id: groupId } = req.params;

        try {
            await workspaceService.checkWorkspaceAccess(groupId, req.user);
            const files = await workspaceService.getFiles(groupId);
            return res.ok({ hasGroup: true, data: files });
        } catch (accessErr) {
            if (accessErr.status === 404 || accessErr.status === 403 || accessErr.status === 400) {
                return res.ok({ hasGroup: false, data: [] });
            }
            throw accessErr;
        }
    } catch (error) {
        next(error);
    }
};

export const createFile = async (req, res, next) => {
    try {
        const { id: groupId } = req.params;
        const { file_name, file_url } = req.body;
        const userId = req.user?.id;

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        
        const newFile = await workspaceService.createFile(groupId, userId, file_name.trim(), file_url.trim());
        
        return res.ok(newFile, 201);
    } catch (error) {
        next(error);
    }
};
