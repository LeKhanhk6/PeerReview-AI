import * as workspaceService from '../services/workspace.service.js';
import { AppError } from '../utils/AppError.js';

export const getTasks = async (req, res, next) => {
    try {
        const { id: groupId } = req.params;

        try {
            await workspaceService.checkWorkspaceAccess(groupId, req.user);
            const tasks = await workspaceService.getTasks(groupId);
            return res.ok({ hasGroup: true, data: tasks });
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

export const createTask = async (req, res, next) => {
    try {
        const { id: groupId } = req.params;
        const { title, status, assignee_id } = req.body;
        const userId = req.user?.id;

        await workspaceService.checkWorkspaceAccess(groupId, req.user);

        if (assignee_id !== null && assignee_id !== undefined) {
            const isValid = await workspaceService.isAssigneeValid(groupId, assignee_id);
            if (!isValid) {
                throw new AppError('Assignee must be a STUDENT member of the group', 400, 'VALIDATION_ERROR');
            }
        }

        const taskData = {
            title: title.trim(),
            status: status ?? 'TODO',
            assignee_id: assignee_id ?? null
        };

        const newTask = await workspaceService.createTask(groupId, userId, taskData);
        return res.ok(newTask, 201);
    } catch (error) {
        next(error);
    }
};

export const updateTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user?.id;
        const { title, status, assignee_id } = req.body;

        const task = await workspaceService.getTaskWithAccess(taskId, req.user);
        const groupId = task.group_id;

        const updateData = {};

        if (title !== undefined) {
            updateData.title = title.trim();
        }

        if (status !== undefined) {
            updateData.status = status;
        }

        if (assignee_id !== undefined) {
            if (assignee_id !== null) {
                const isValid = await workspaceService.isAssigneeValid(groupId, assignee_id);
                if (!isValid) {
                    throw new AppError('Assignee must be a STUDENT member of the group', 400, 'VALIDATION_ERROR');
                }
            }
            updateData.assignee_id = assignee_id;
        }

        const updatedTask = await workspaceService.updateTask(taskId, userId, updateData);
        return res.ok(updatedTask);
    } catch (error) {
        next(error);
    }
};

export const deleteTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user?.id;

        // Uses getTaskWithAccess instead of checkWorkspaceAccess manually
        await workspaceService.getTaskWithAccess(taskId, req.user);
        
        await workspaceService.deleteTask(taskId, userId);
        
        return res.ok(null);
    } catch (error) {
        next(error);
    }
};
