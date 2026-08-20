import pool from '../config/db.js';

// --- HELPER QUERIES ---

export const getGroupOwnershipInfo = async (groupId) => {
    const query = `
        SELECT g.id, g.class_id, c.teacher_id 
        FROM groups g
        JOIN classes c ON g.class_id = c.id
        WHERE g.id = $1
    `;
    const result = await pool.query(query, [groupId]);
    return result.rows[0];
};

export const getClassOwnershipInfo = async (classId) => {
    const query = 'SELECT id, teacher_id FROM classes WHERE id = $1';
    const result = await pool.query(query, [classId]);
    return result.rows[0];
};

export const checkStudentCanJoinGroup = async (groupInfo, userId) => {
    // User Existence and Role check
    const userResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }
    const targetUser = userResult.rows[0];
    if (targetUser.role !== 'STUDENT') {
        const error = new Error('Only users with STUDENT role can be added to a group');
        error.status = 400;
        throw error;
    }

    // Check duplicate membership in this group
    const duplicateCheck = await pool.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [groupInfo.id, userId]);
    if (duplicateCheck.rows.length > 0) {
        const error = new Error('User is already a member of this group');
        error.status = 409;
        throw error;
    }

    // Check 1 Student = Max 1 Group per Class
    const classGroupCheck = await pool.query(`
        SELECT g.id 
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1 AND g.class_id = $2
    `, [userId, groupInfo.class_id]);

    if (classGroupCheck.rows.length > 0) {
        const error = new Error('Student already belongs to another group in this class');
        error.status = 409;
        throw error;
    }
};

// --- CRUD OPERATIONS ---

export const getAllGroups = async (user, classId) => {
    let query = '';
    const values = [];

    const baseSelect = `
        SELECT g.id, g.class_id, c.name as class_name, g.name, g.created_at, 
        (SELECT count(*)::int FROM group_members WHERE group_id = g.id) as member_count
    `;

    if (user.role === 'ADMIN') {
        query = `${baseSelect} FROM groups g JOIN classes c ON g.class_id = c.id`;
        if (classId) {
            query += ' WHERE g.class_id = $1';
            values.push(classId);
        }
    } else if (user.role === 'TEACHER') {
        query = `
            ${baseSelect} 
            FROM groups g 
            JOIN classes c ON g.class_id = c.id 
            WHERE c.teacher_id = $1
        `;
        values.push(user.userId);
        if (classId) {
            query += ' AND g.class_id = $2';
            values.push(classId);
        }
    } else if (user.role === 'STUDENT') {
        query = `
            ${baseSelect} 
            FROM groups g 
            JOIN classes c ON g.class_id = c.id
            JOIN group_members gm ON g.id = gm.group_id 
            WHERE gm.user_id = $1
        `;
        values.push(user.userId);
        if (classId) {
            query += ' AND g.class_id = $2';
            values.push(classId);
        }
    } else {
        const error = new Error('Unsupported role');
        error.status = 403;
        throw error;
    }

    query += ' ORDER BY g.created_at DESC';
    const result = await pool.query(query, values);
    return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        class: {
            id: row.class_id,
            name: row.class_name
        },
        created_at: row.created_at,
        member_count: row.member_count
    }));
};

export const getGroupById = async (id, user) => {
    let query = '';
    const values = [id];

    if (user.role === 'ADMIN') {
        query = 'SELECT g.*, c.name as class_name FROM groups g JOIN classes c ON g.class_id = c.id WHERE g.id = $1';
    } else if (user.role === 'TEACHER') {
        query = `
            SELECT g.*, c.name as class_name FROM groups g 
            JOIN classes c ON g.class_id = c.id 
            WHERE g.id = $1 AND c.teacher_id = $2
        `;
        values.push(user.userId);
    } else if (user.role === 'STUDENT') {
        query = `
            SELECT g.*, c.name as class_name FROM groups g 
            JOIN classes c ON g.class_id = c.id
            JOIN group_members gm ON g.id = gm.group_id 
            WHERE g.id = $1 AND gm.user_id = $2
        `;
        values.push(user.userId);
    } else {
        const error = new Error('Unsupported role');
        error.status = 403;
        throw error;
    }

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
        // Group might exist but user doesn't have permission, or it might not exist at all.
        // Check if group exists globally
        const existCheck = await pool.query('SELECT id FROM groups WHERE id = $1', [id]);
        if (existCheck.rows.length > 0) {
            const error = new Error('Forbidden: You do not have permission to view this group');
            error.status = 403;
            throw error;
        } else {
            const error = new Error('Group not found');
            error.status = 404;
            throw error;
        }
    }

    const group = result.rows[0];

    // Fetch members
    const membersQuery = `
        SELECT u.id, u.full_name, u.email, gm.is_leader, gm.joined_at 
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1
    `;
    const membersResult = await pool.query(membersQuery, [id]);

    return {
        id: group.id,
        name: group.name,
        class: {
            id: group.class_id,
            name: group.class_name
        },
        created_at: group.created_at,
        members: membersResult.rows
    };
};

export const createGroup = async (classId, name) => {
    const query = `
        INSERT INTO groups (class_id, name)
        VALUES ($1, $2)
        RETURNING id, class_id, name, created_at;
    `;
    const result = await pool.query(query, [classId, name]);
    return result.rows[0];
};

export const addMember = async (groupId, userId, currentUser) => {
    // 1. Get Group & Class Info (also verifies Group existence)
    const groupInfo = await getGroupOwnershipInfo(groupId);
    if (!groupInfo) {
        const error = new Error('Group not found');
        error.status = 404;
        throw error;
    }

    // 2. Authorization
    if (currentUser.role === 'TEACHER' && groupInfo.teacher_id !== currentUser.userId) {
        const error = new Error('Forbidden: You do not manage this class');
        error.status = 403;
        throw error;
    }

    // 3. Common Membership Checks
    await checkStudentCanJoinGroup(groupInfo, userId);

    // 6. Insert Member
    const insertQuery = `
        INSERT INTO group_members (group_id, user_id)
        VALUES ($1, $2)
        RETURNING group_id, user_id, joined_at;
    `;
    const insertResult = await pool.query(insertQuery, [groupId, userId]);
    return insertResult.rows[0];
};

export const removeMember = async (groupId, userId, currentUser) => {
    // 1. Get Group Info
    const groupInfo = await getGroupOwnershipInfo(groupId);
    if (!groupInfo) {
        const error = new Error('Group not found');
        error.status = 404;
        throw error;
    }

    // 2. Authorization
    if (currentUser.role === 'TEACHER' && groupInfo.teacher_id !== currentUser.userId) {
        const error = new Error('Forbidden: You do not manage this class');
        error.status = 403;
        throw error;
    }

    // 3. User Existence
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    // 4. Check if member
    const memberCheck = await pool.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (memberCheck.rows.length === 0) {
        const error = new Error('Group member not found');
        error.status = 404;
        throw error;
    }

    // 5. Delete Member
    const deleteQuery = 'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2';
    await pool.query(deleteQuery, [groupId, userId]);
    return true;
};

export const studentJoinGroup = async (groupId, studentId) => {
    const groupCheck = await pool.query('SELECT id, class_id FROM groups WHERE id = $1', [groupId]);
    if (groupCheck.rows.length === 0) {
        const error = new Error('Group not found');
        error.status = 404;
        throw error;
    }

    await checkStudentCanJoinGroup(groupCheck.rows[0], studentId);

    const insertQuery = `
        INSERT INTO group_members (group_id, user_id, is_leader)
        VALUES ($1, $2, false)
        RETURNING group_id, user_id, is_leader, joined_at;
    `;
    const insertResult = await pool.query(insertQuery, [groupId, studentId]);
    return insertResult.rows[0];
};

export const studentLeaveGroup = async (groupId, studentId) => {
    const groupCheck = await pool.query('SELECT id FROM groups WHERE id = $1', [groupId]);
    if (groupCheck.rows.length === 0) {
        const error = new Error('Group not found');
        error.status = 404;
        throw error;
    }

    const memberCheck = await pool.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, studentId]);
    if (memberCheck.rows.length === 0) {
        const error = new Error('Group member not found');
        error.status = 404;
        throw error;
    }

    await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, studentId]);
    return true;
};
