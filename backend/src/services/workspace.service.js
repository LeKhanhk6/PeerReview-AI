import pool from '../config/db.js';
import { logActivity } from './activity.service.js';

// ==========================================
// AUTHORIZATION HELPERS
// ==========================================

export const getGroupAccessInfo = async (groupId) => {
    const result = await pool.query(`
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

    // ADMIN luôn có quyền
    if (currentUser.role === 'ADMIN') {
        return groupInfo;
    }

    // TEACHER: Kiểm tra teacher_id của class
    if (currentUser.role === 'TEACHER') {
        if (groupInfo.teacher_id === currentUser.userId) {
            return groupInfo;
        }
    }

    // STUDENT: Kiểm tra xem có trong group_members không
    if (currentUser.role === 'STUDENT') {
        const memberCheck = await pool.query(`
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

// Lấy group_id từ taskId (dùng cho PATCH/DELETE task)
export const getTaskGroupInfo = async (taskId) => {
    const result = await pool.query(`
        SELECT group_id FROM tasks WHERE id = $1
    `, [taskId]);
    
    return result.rows[0] || null;
};

// ==========================================
// TASK MANAGEMENT
// ==========================================

export const getTasks = async (groupId) => {
    const result = await pool.query(`
        SELECT id, group_id, assignee_id, title, status, created_at, completed_at
        FROM tasks
        WHERE group_id = $1
        ORDER BY created_at DESC
    `, [groupId]);
    return result.rows;
};

export const createTask = async (groupId, userId, taskData) => {
    const { title, status = 'TODO', assignee_id } = taskData;
    
    const result = await pool.query(`
        INSERT INTO tasks (group_id, title, status, assignee_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, group_id, assignee_id, title, status, created_at, completed_at
    `, [groupId, title, status, assignee_id ?? null]);
    
    const task = result.rows[0];
    
    await logActivity(groupId, userId, 'CREATE', `Created task "${title}"`);
    if (assignee_id) {
        await logActivity(groupId, userId, 'ASSIGN', `Assigned task "${title}"`);
    }
    
    return task;
};

export const updateTask = async (taskId, userId, updateData) => {
    const fields = [];
    const values = [];
    let queryIndex = 1;

    // Cập nhật trạng thái completed_at nếu status đổi thành DONE
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
        return null; // Không có gì để update
    }

    values.push(taskId);
    
    const query = `
        UPDATE tasks
        SET ${fields.join(', ')}
        WHERE id = $${queryIndex}
        RETURNING id, group_id, assignee_id, title, status, created_at, completed_at
    `;

    const result = await pool.query(query, values);
    const task = result.rows[0];
    
    if (task) {
        const groupId = task.group_id;
        if (updateData.title !== undefined) {
            await logActivity(groupId, userId, 'EDIT', `Updated task title to "${updateData.title}"`);
        }
        if (updateData.assignee_id !== undefined) {
            await logActivity(groupId, userId, 'ASSIGN', `Changed assignee for task "${task.title}"`);
        }
        if (updateData.status !== undefined) {
            if (updateData.status === 'DONE') {
                await logActivity(groupId, userId, 'COMPLETE', `Completed task "${task.title}"`);
            } else {
                await logActivity(groupId, userId, 'EDIT', `Changed status of task "${task.title}" to ${updateData.status}`);
            }
        }
    }
    
    return task || null;
};

export const deleteTask = async (taskId, userId) => {
    const result = await pool.query(`
        DELETE FROM tasks WHERE id = $1
        RETURNING id, title, group_id
    `, [taskId]);
    
    const task = result.rows[0];
    if (task) {
        await logActivity(task.group_id, userId, 'DELETE', `Deleted task "${task.title}"`);
    }
    
    return task || null;
};

// Helper để check assignee có hợp lệ không
export const isAssigneeValid = async (groupId, assigneeId) => {
    if (!assigneeId) return true; // NULL được phép
    
    const result = await pool.query(`
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
    const result = await pool.query(`
        SELECT id, group_id, user_id, message, created_at
        FROM group_discussions
        WHERE group_id = $1
        ORDER BY created_at ASC
    `, [groupId]);
    return result.rows;
};

export const createDiscussion = async (groupId, userId, message) => {
    const result = await pool.query(`
        INSERT INTO group_discussions (group_id, user_id, message)
        VALUES ($1, $2, $3)
        RETURNING id, group_id, user_id, message, created_at
    `, [groupId, userId, message]);
    
    const discussion = result.rows[0];
    await logActivity(groupId, userId, 'DISCUSSION_POST', 'Posted a new discussion message');
    
    return discussion;
};

// ==========================================
// GROUP FILES
// ==========================================

export const getFiles = async (groupId) => {
    const result = await pool.query(`
        SELECT id, group_id, uploaded_by, file_name, file_url, created_at
        FROM group_files
        WHERE group_id = $1
        ORDER BY created_at DESC
    `, [groupId]);
    return result.rows;
};

export const createFile = async (groupId, userId, fileName, fileUrl) => {
    const result = await pool.query(`
        INSERT INTO group_files (group_id, uploaded_by, file_name, file_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, group_id, uploaded_by, file_name, file_url, created_at
    `, [groupId, userId, fileName, fileUrl]);
    
    const file = result.rows[0];
    await logActivity(groupId, userId, 'FILE_UPLOAD', `Uploaded file "${fileName}"`);
    
    return file;
};
