import pool from '../config/db.js';
import { logActivity } from './activity.service.js';
import { ACTIVITY_TYPES } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
import { withTransaction } from '../utils/db.util.js';
import { sanitizeForLog } from '../utils/masking.util.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const validateId = (id, fieldName = 'ID') => {
    if (id === null || id === undefined) {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    if (typeof id === 'string') {
        const trimmed = id.trim();
        if (UUID_REGEX.test(trimmed)) {
            return trimmed;
        }
        const numericId = Number(trimmed);
        if (Number.isInteger(numericId) && numericId > 0) {
            return numericId;
        }
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
        return numericId;
    }
    throw new AppError(`Invalid ${fieldName}`, 400);
};

const executeQuery = async (queryText, params) => {
    try {
        return await pool.query(queryText, params);
    } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error({ message: 'Database error in workspace.service', error: err.message, stack: err.stack });
        throw new AppError('Database error occurred', 500, { original: err.message });
    }
};

// ==========================================
// AUTHORIZATION HELPERS
// ==========================================

export const getGroupAccessInfo = async (groupId) => {
    const validGroupId = validateId(groupId, 'group ID');
    const result = await executeQuery(`
        SELECT g.id, g.class_id, c.teacher_id
        FROM groups g
        JOIN classes c ON g.class_id = c.id
        WHERE g.id = $1
    `, [validGroupId]);
    
    return result.rows[0] || null;
};

export const checkWorkspaceAccess = async (groupId, currentUser) => {
    const validGroupId = validateId(groupId, 'group ID');
    const groupInfo = await getGroupAccessInfo(validGroupId);
    if (!groupInfo) {
        throw new AppError('Group not found', 404);
    }

    if (currentUser.role === 'ADMIN') {
        return groupInfo;
    }

    if (currentUser.role === 'TEACHER') {
        if (groupInfo.teacher_id === currentUser.userId) {
            return groupInfo;
        }
    }

    if (currentUser.role === 'STUDENT') {
        const memberCheck = await executeQuery(`
            SELECT 1 FROM group_members 
            WHERE group_id = $1 AND user_id = $2
        `, [validGroupId, currentUser.userId]);
        
        if (memberCheck.rows.length > 0) {
            return groupInfo;
        }
    }

    throw new AppError('Forbidden: You do not have permission to access this workspace', 403);
};

export const getTaskGroupInfo = async (taskId) => {
    const validTaskId = validateId(taskId, 'task ID');
    const result = await executeQuery(`
        SELECT group_id FROM tasks WHERE id = $1
    `, [validTaskId]);
    
    return result.rows[0] || null;
};

// ==========================================
// TASK MANAGEMENT
// ==========================================

export const getTasks = async (groupId) => {
    const validGroupId = validateId(groupId, 'group ID');
    const result = await executeQuery(`
        SELECT id, group_id, assignee_id, title, status, created_at, completed_at
        FROM tasks
        WHERE group_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
    `, [validGroupId]);
    return result.rows;
};

export const createTask = async (groupId, userId, taskData) => {
    const validGroupId = validateId(groupId, 'group ID');
    const { title, status = 'TODO', assignee_id } = taskData;
    
    if (!title || typeof title !== 'string' || !title.trim()) {
        throw new AppError('Title is required', 400);
    }
    
    const result = await executeQuery(`
        INSERT INTO tasks (group_id, title, status, assignee_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, group_id, assignee_id, title, status, created_at, completed_at
    `, [validGroupId, title.trim(), status, assignee_id ?? null]);
    
    const task = result.rows[0];
    
    await logActivity({
        groupId: validGroupId, 
        userId, 
        actionType: ACTIVITY_TYPES.TASK_CREATE, 
        targetId: `${ACTIVITY_TYPES.TASK_CREATE}_${task.id}`,
        contentSummary: `Created task "${title.trim()}"`
    });
    if (assignee_id) {
        await logActivity({
            groupId, 
            userId, 
            actionType: ACTIVITY_TYPES.TASK_ASSIGN, 
            targetId: `${ACTIVITY_TYPES.TASK_ASSIGN}_${task.id}`,
            contentSummary: `Assigned task "${title}"`
        });
    }
    
    return task;
};

export const getTaskWithAccess = async (taskId, currentUser) => {
    const validTaskId = validateId(taskId, 'task ID');
    
    // 1. Fetch task and get group_id
    const taskResult = await executeQuery(`
        SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL
    `, [validTaskId]);
    
    const task = taskResult.rows[0];
    if (!task) {
        throw new AppError('Task not found', 404);
    }
    
    // 2. Check access using the group_id
    await checkWorkspaceAccess(task.group_id, currentUser);
    
    return task;
};

export const updateTask = async (taskId, userId, updateData) => {
    const validTaskId = validateId(taskId, 'task ID');
    
    if (!updateData || Object.keys(updateData).length === 0) {
        throw new AppError('No fields to update', 400);
    }

    return withTransaction(async (client) => {
        // 1. SELECT FOR UPDATE to lock the row and get 'before' state
        const checkResult = await client.query(`
            SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL FOR UPDATE
        `, [validTaskId]);
        
        const oldTask = checkResult.rows[0];
        if (!oldTask) {
            throw new AppError('Task not found', 404);
        }

        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (updateData.status !== undefined) {
            fields.push(`status = $${queryIndex++}`);
            values.push(updateData.status);
            if (updateData.status === 'DONE') {
                fields.push(`completed_at = COALESCE(completed_at, NOW())`);
            } else {
                fields.push(`completed_at = NULL`);
            }
        }

        if (updateData.title !== undefined) {
            if (!updateData.title || typeof updateData.title !== 'string' || !updateData.title.trim()) {
                throw new AppError('Title is required', 400);
            }
            fields.push(`title = $${queryIndex++}`);
            values.push(updateData.title.trim());
        }

        if (updateData.assignee_id !== undefined) {
            fields.push(`assignee_id = $${queryIndex++}`);
            values.push(updateData.assignee_id);
        }

        if (fields.length === 0) {
            throw new AppError('No valid fields to update', 400);
        }

        values.push(validTaskId);
        
        const query = `
            UPDATE tasks
            SET ${fields.join(', ')}
            WHERE id = $${queryIndex}
            RETURNING id, group_id, assignee_id, title, status, created_at, completed_at
        `;

        const result = await client.query(query, values);
        const newTask = result.rows[0];
        
        const groupId = newTask.group_id;
        const changes = [];
        
        if (updateData.title !== undefined && updateData.title !== oldTask.title) changes.push('title');
        if (updateData.assignee_id !== undefined && updateData.assignee_id !== oldTask.assignee_id) changes.push('assignee');
        if (updateData.status !== undefined && updateData.status !== oldTask.status) {
            changes.push(`status → ${updateData.status}`);
        }

        if (changes.length > 0) {
            const isCompleted = updateData.status === 'DONE';
            const actionType = isCompleted ? ACTIVITY_TYPES.TASK_COMPLETE : ACTIVITY_TYPES.TASK_UPDATE;
            
            await logActivity({
                groupId, 
                userId, 
                actionType, 
                targetId: `${actionType}_${newTask.id}`,
                contentSummary: `Updated task "${newTask.title}" (${changes.join(', ')})`
            });
            
            logger.info({ 
                event: 'task.updated', 
                taskId: validTaskId, 
                userId,
                before: sanitizeForLog(oldTask), 
                after: sanitizeForLog(newTask) 
            });
        }
        
        return newTask;
    }, 'REPEATABLE READ');
};

export const deleteTask = async (taskId, userId) => {
    const validTaskId = validateId(taskId, 'task ID');
    
    return withTransaction(async (client) => {
        // Use SELECT FOR UPDATE for consistency during deletion
        const checkResult = await client.query(`
            SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL FOR UPDATE
        `, [validTaskId]);
        
        const oldTask = checkResult.rows[0];
        if (!oldTask) {
            throw new AppError('Task not found', 404);
        }

        const result = await client.query(`
            UPDATE tasks SET deleted_at = NOW() WHERE id = $1
            RETURNING id, title, group_id
        `, [validTaskId]);
        
        const task = result.rows[0];

        await logActivity({
            groupId: task.group_id, 
            userId, 
            actionType: ACTIVITY_TYPES.TASK_DELETE, 
            targetId: `${ACTIVITY_TYPES.TASK_DELETE}_${task.id}`,
            contentSummary: `Deleted task "${task.title}"`
        });
        
        logger.info({ 
            event: 'task.deleted', 
            taskId: validTaskId, 
            userId,
            task: sanitizeForLog(oldTask)
        });
        
        return task;
    }, 'REPEATABLE READ');
};

export const isAssigneeValid = async (groupId, assigneeId) => {
    const validGroupId = validateId(groupId, 'group ID');
    if (!assigneeId) return true;
    
    const result = await executeQuery(`
        SELECT 1 FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1 AND gm.user_id = $2 AND u.role = 'STUDENT'
    `, [validGroupId, assigneeId]);
    
    return result.rows.length > 0;
};

// ==========================================
// GROUP DISCUSSIONS
// ==========================================

export const getDiscussions = async (groupId) => {
    const validGroupId = validateId(groupId, 'group ID');
    const result = await executeQuery(`
        SELECT id, group_id, user_id, message, created_at
        FROM group_discussions
        WHERE group_id = $1
        ORDER BY created_at ASC
    `, [validGroupId]);
    return result.rows;
};

export const createDiscussion = async (groupId, userId, message) => {
    const validGroupId = validateId(groupId, 'group ID');
    if (!message || typeof message !== 'string' || !message.trim()) {
        throw new AppError('Message is required', 400);
    }

    const result = await executeQuery(`
        INSERT INTO group_discussions (group_id, user_id, message)
        VALUES ($1, $2, $3)
        RETURNING id, group_id, user_id, message, created_at
    `, [validGroupId, userId, message.trim()]);
    
    const discussion = result.rows[0];
    await logActivity({
        groupId, 
        userId, 
        actionType: ACTIVITY_TYPES.DISCUSSION_POST, 
        targetId: `${ACTIVITY_TYPES.DISCUSSION_POST}_${discussion.id}`,
        contentSummary: 'Posted a new discussion message'
    });
    
    return discussion;
};

// ==========================================
// GROUP FILES
// ==========================================

export const getFiles = async (groupId) => {
    const validGroupId = validateId(groupId, 'group ID');
    const result = await executeQuery(`
        SELECT id, group_id, uploaded_by, file_name, file_url, created_at
        FROM group_files
        WHERE group_id = $1
        ORDER BY created_at DESC
    `, [validGroupId]);
    return result.rows;
};

export const createFile = async (groupId, userId, fileName, fileUrl) => {
    const validGroupId = validateId(groupId, 'group ID');
    if (!fileName || !fileUrl) {
        throw new AppError('File name and URL are required', 400);
    }
    const result = await executeQuery(`
        INSERT INTO group_files (group_id, uploaded_by, file_name, file_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, group_id, uploaded_by, file_name, file_url, created_at
    `, [validGroupId, userId, fileName, fileUrl]);
    
    const file = result.rows[0];
    await logActivity({
        groupId, 
        userId, 
        actionType: ACTIVITY_TYPES.FILE_UPLOAD, 
        targetId: `${ACTIVITY_TYPES.FILE_UPLOAD}_${file.id}`,
        contentSummary: `Uploaded file "${fileName}"`
    });
    
    return file;
};
