import * as workspaceService from '../services/workspace.service.js';
import * as storageService from '../services/storage.service.js';
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
        const userId = req.user?.id;
        const file = req.file;

        if (!file) {
            throw new AppError('File is required', 400);
        }

        // Check if user has access to group
        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        
        // Upload to Supabase
        const filePath = await storageService.uploadWorkspaceFile(
            file.buffer, 
            file.originalname, 
            file.mimetype, 
            groupId
        );

        // Store file metadata in DB
        const newFile = await workspaceService.createFile(groupId, userId, file.originalname, filePath);
        
        return res.ok(newFile, 201);
    } catch (error) {
        next(error);
    }
};

export const downloadFile = async (req, res, next) => {
    try {
        const { groupId, fileId } = req.params;
        
        // Check access: must be group member or teacher
        await workspaceService.checkWorkspaceAccess(groupId, req.user);

        // Fetch file record from DB to get the path
        const fileRecord = await workspaceService.getFileById(groupId, fileId);
        if (!fileRecord) {
            throw new AppError('File not found', 404);
        }

        // Generate signed URL
        const signedUrl = await storageService.getWorkspaceFileSignedUrl(fileRecord.file_url, fileRecord.file_name);

        // Redirect browser to signed URL, prevent cache
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.redirect(302, signedUrl);
    } catch (error) {
        next(error);
    }
};
