import pool from '../config/db.js';
import { logActivity } from './activity.service.js';
import { ACTIVITY_TYPES } from '../utils/constants.js';

const executeQuery = async (queryText, params) => {
    try {
        return await pool.query(queryText, params);
    } catch (err) {
        const error = new Error('Database error occurred');
        error.statusCode = 500;
        error.originalError = err;
        throw error;
    }
};

// ==========================================
// AUTHORIZATION HELPERS
// ==========================================

export const getGroupAccessInfo = async (groupId) => {
    const result = await executeQuery(`
        SELECT g.id, g.class_id, c.teacher_id
        FROM groups g
        JOIN classes c ON g.class_id = c.id
        WHERE g.id = $1
    `, [groupId]);
    
    return result.rows[0] || null;
};

export const checkWorkspaceAccess = async (groupId, currentUser) => {
    const groupInfo = await getGroupAccessInfo(groupId);
    if (!groupInfo) {
        const error = new Error('Group not found');
        error.statusCode = 404;
        throw error;
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
        `, [groupId, currentUser.userId]);
        
        if (memberCheck.rows.length > 0) {
            return groupInfo;
        }
    }

    const error = new Error('Forbidden: You do not have permission to access this workspace');
    error.statusCode = 403;
    throw error;
};

export const getTaskGroupInfo = async (taskId) => {
    const result = await executeQuery(`
        SELECT group_id FROM tasks WHERE id = $1
    `, [taskId]);
    
    return result.rows[0] || null;
};

// ==========================================
// TASK MANAGEMENT
// ==========================================

export const getTasks = async (groupId) => {
    const result = await executeQuery(`
        SELECT id, group_id, assignee_id, title, status, created_at, completed_at
        FROM tasks
        WHERE group_id = $1
        ORDER BY created_at DESC
    `, [groupId]);
    return result.rows;
};

export const createTask = async (groupId, userId, taskData) => {
    const { title, status = 'TODO', assignee_id } = taskData;
    
    const result = await executeQuery(`
        INSERT INTO tasks (group_id, title, status, assignee_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, group_id, assignee_id, title, status, created_at, completed_at
    `, [groupId, title, status, assignee_id ?? null]);
    
    const task = result.rows[0];
    
    await logActivity(groupId, userId, ACTIVITY_TYPES.TASK_CREATE, `Created task "${title}"`);
    if (assignee_id) {
        await logActivity(groupId, userId, ACTIVITY_TYPES.TASK_ASSIGN, `Assigned task "${title}"`);
    }
    
    return task;
};

export const updateTask = async (taskId, userId, updateData) => {
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
        fields.push(`title = $${queryIndex++}`);
        values.push(updateData.title);
    }

    if (updateData.assignee_id !== undefined) {
        fields.push(`assignee_id = $${queryIndex++}`);
        values.push(updateData.assignee_id);
    }

    if (fields.length === 0) {
        return null; 
    }

    values.push(taskId);
    
    const query = `
        UPDATE tasks
        SET ${fields.join(', ')}
        WHERE id = $${queryIndex}
        RETURNING id, group_id, assignee_id, title, status, created_at, completed_at
    `;

    const result = await executeQuery(query, values);
    const task = result.rows[0];
    
    if (task) {
        const groupId = task.group_id;
        const changes = [];
        
        if (updateData.title !== undefined) changes.push('title');
        if (updateData.assignee_id !== undefined) changes.push('assignee');
        if (updateData.status !== undefined) {
            changes.push(`status → ${updateData.status}`);
        }

        if (changes.length > 0) {
            const isCompleted = updateData.status === 'DONE';
            const actionType = isCompleted ? ACTIVITY_TYPES.TASK_COMPLETE : ACTIVITY_TYPES.TASK_UPDATE;
            
            await logActivity(
                groupId, 
                userId, 
                actionType, 
                `Updated task "${task.title}" (${changes.join(', ')})`
            );
        }
    }
    
    return task || null;
};

export const deleteTask = async (taskId, userId) => {
    const result = await executeQuery(`
        DELETE FROM tasks WHERE id = $1
        RETURNING id, title, group_id
    `, [taskId]);
    
    const task = result.rows[0];
    if (task) {
        await logActivity(task.group_id, userId, ACTIVITY_TYPES.TASK_DELETE, `Deleted task "${task.title}"`);
    }
    
    return task || null;
};

export const isAssigneeValid = async (groupId, assigneeId) => {
    if (!assigneeId) return true;
    
    const result = await executeQuery(`
        SELECT 1 FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1 AND gm.user_id = $2 AND u.role = 'STUDENT'
    `, [groupId, assigneeId]);
    
    return result.rows.length > 0;
};

// ==========================================
// GROUP DISCUSSIONS
// ==========================================

export const getDiscussions = async (groupId) => {
    const result = await executeQuery(`
        SELECT id, group_id, user_id, message, created_at
        FROM group_discussions
        WHERE group_id = $1
        ORDER BY created_at ASC
    `, [groupId]);
    return result.rows;
};

export const createDiscussion = async (groupId, userId, message) => {
    const result = await executeQuery(`
        INSERT INTO group_discussions (group_id, user_id, message)
        VALUES ($1, $2, $3)
        RETURNING id, group_id, user_id, message, created_at
    `, [groupId, userId, message]);
    
    const discussion = result.rows[0];
    await logActivity(groupId, userId, ACTIVITY_TYPES.DISCUSSION_POST, 'Posted a new discussion message');
    
    return discussion;
};

// ==========================================
// GROUP FILES
// ==========================================

export const getFiles = async (groupId) => {
    const result = await executeQuery(`
        SELECT id, group_id, uploaded_by, file_name, file_url, created_at
        FROM group_files
        WHERE group_id = $1
        ORDER BY created_at DESC
    `, [groupId]);
    return result.rows;
};

export const createFile = async (groupId, userId, fileName, fileUrl) => {
    const result = await executeQuery(`
        INSERT INTO group_files (group_id, uploaded_by, file_name, file_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, group_id, uploaded_by, file_name, file_url, created_at
    `, [groupId, userId, fileName, fileUrl]);
    
    const file = result.rows[0];
    await logActivity(groupId, userId, ACTIVITY_TYPES.FILE_UPLOAD, `Uploaded file "${fileName}"`);
    
    return file;
};
