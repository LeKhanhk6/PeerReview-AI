import * as workspaceService from '../services/workspace.service.js';
import { isValidUUID, isValidHttpUrl } from '../utils/validation.util.js';

// ==========================================
// TASK MANAGEMENT
// ==========================================

export const getTasks = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        
        if (!isValidUUID(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        const tasks = await workspaceService.getTasks(groupId);
        
        res.status(200).json(tasks);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createTask = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { title, status, assignee_id } = req.body;

        if (!isValidUUID(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ message: 'Title is required and cannot be empty' });
        }
        
        const normalizedTitle = title.trim();
        if (normalizedTitle.length > 255) {
            return res.status(400).json({ message: 'Title exceeds maximum length of 255 characters' });
        }

        if (status !== undefined && status !== null && !['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid Task Status' });
        }

        if (assignee_id !== undefined && assignee_id !== null && !isValidUUID(assignee_id)) {
            return res.status(400).json({ message: 'Invalid assignee_id format' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);

        if (assignee_id !== null && assignee_id !== undefined) {
            const isValid = await workspaceService.isAssigneeValid(groupId, assignee_id);
            if (!isValid) {
                return res.status(400).json({ message: 'Assignee must be a STUDENT member of the group' });
            }
        }

        const taskData = {
            title: normalizedTitle,
            status: status ?? 'TODO',
            assignee_id: assignee_id ?? null
        };

        const newTask = await workspaceService.createTask(groupId, req.user.userId, taskData);
        res.status(201).json(newTask);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!isValidUUID(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID format' });
        }

        // Kiểm tra strict whitelist
        const allowedFields = ['title', 'status', 'assignee_id'];
        const requestFields = Object.keys(req.body);
        
        if (requestFields.length === 0) {
            return res.status(400).json({ message: 'At least one valid field (title, status, assignee_id) is required for update' });
        }

        const hasInvalidField = requestFields.some(field => !allowedFields.includes(field));
        if (hasInvalidField) {
            return res.status(400).json({ message: 'Request contains invalid update field' });
        }

        const { title, status, assignee_id } = req.body;

        const taskInfo = await workspaceService.getTaskGroupInfo(taskId);
        if (!taskInfo) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const groupId = taskInfo.group_id;
        await workspaceService.checkWorkspaceAccess(groupId, req.user);

        // Validation Update Fields
        const updateData = {};

        if (title !== undefined) {
            if (typeof title !== 'string' || title.trim().length === 0) {
                return res.status(400).json({ message: 'Invalid title' });
            }
            const normalizedTitle = title.trim();
            if (normalizedTitle.length > 255) {
                return res.status(400).json({ message: 'Title exceeds maximum length of 255 characters' });
            }
            updateData.title = normalizedTitle;
        }

        if (status !== undefined) {
            if (status !== null && !['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
                return res.status(400).json({ message: 'Invalid Task Status' });
            }
            updateData.status = status;
        }

        if (assignee_id !== undefined) {
            if (assignee_id !== null && !isValidUUID(assignee_id)) {
                return res.status(400).json({ message: 'Invalid assignee_id format' });
            }
            if (assignee_id !== null) {
                const isValid = await workspaceService.isAssigneeValid(groupId, assignee_id);
                if (!isValid) {
                    return res.status(400).json({ message: 'Assignee must be a STUDENT member of the group' });
                }
            }
            updateData.assignee_id = assignee_id;
        }

        const updatedTask = await workspaceService.updateTask(taskId, req.user.userId, updateData);
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        res.status(200).json(updatedTask);

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!isValidUUID(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID format' });
        }

        const taskInfo = await workspaceService.getTaskGroupInfo(taskId);
        if (!taskInfo) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await workspaceService.checkWorkspaceAccess(taskInfo.group_id, req.user);
        
        const deletedTask = await workspaceService.deleteTask(taskId, req.user.userId);
        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        res.status(204).send();

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// GROUP DISCUSSIONS
// ==========================================

export const getDiscussions = async (req, res) => {
    try {
        const { id: groupId } = req.params;

        if (!isValidUUID(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        const discussions = await workspaceService.getDiscussions(groupId);
        
        res.status(200).json(discussions);
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

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ message: 'Message content is required and cannot be empty' });
        }

        const normalizedMessage = message.trim();
        if (normalizedMessage.length > 5000) {
            return res.status(400).json({ message: 'Message exceeds maximum length' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        
        const userId = req.user.userId; // JWT Identity
        const newDiscussion = await workspaceService.createDiscussion(groupId, userId, normalizedMessage);
        
        res.status(201).json(newDiscussion);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// GROUP FILES
// ==========================================

export const getFiles = async (req, res) => {
    try {
        const { id: groupId } = req.params;

        if (!isValidUUID(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        const files = await workspaceService.getFiles(groupId);
        
        res.status(200).json(files);
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

        if (!file_name || typeof file_name !== 'string' || file_name.trim().length === 0) {
            return res.status(400).json({ message: 'File name is required' });
        }

        const normalizedFileName = file_name.trim();
        if (normalizedFileName.length > 255) {
            return res.status(400).json({ message: 'File name exceeds maximum length' });
        }

        if (!file_url || typeof file_url !== 'string' || !isValidHttpUrl(file_url.trim())) {
            return res.status(400).json({ message: 'A valid absolute HTTP/HTTPS file URL is required' });
        }

        const normalizedFileUrl = file_url.trim();
        if (normalizedFileUrl.length > 2048) {
            return res.status(400).json({ message: 'File URL exceeds maximum length' });
        }

        await workspaceService.checkWorkspaceAccess(groupId, req.user);
        
        const userId = req.user.userId; // JWT Identity
        
        const newFile = await workspaceService.createFile(groupId, userId, normalizedFileName, normalizedFileUrl);
        
        res.status(201).json(newFile);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
