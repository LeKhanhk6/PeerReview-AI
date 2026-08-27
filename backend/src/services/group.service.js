import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/db.util.js';

// --- CONSTANTS ---
const NOT_FOUND_MSG = 'Group not found or you do not have permission to view it';

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
        throw new AppError('User not found', 404);
    }
    const targetUser = userResult.rows[0];
    if (targetUser.role !== 'STUDENT') {
        throw new AppError('Only users with STUDENT role can be added to a group', 400);
    }

    // Check Class Membership
    const classMembershipCheck = await pool.query('SELECT 1 FROM class_members WHERE class_id = $1 AND user_id = $2', [groupInfo.class_id, userId]);
    if (classMembershipCheck.rows.length === 0) {
        throw new AppError('Student is not enrolled in this class', 403);
    }

    // Check duplicate membership in this group
    const duplicateCheck = await pool.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [groupInfo.id, userId]);
    if (duplicateCheck.rows.length > 0) {
        throw new AppError('User is already a member of this group', 409);
    }

    // Check 1 Student = Max 1 Group per Class
    const classGroupCheck = await pool.query(`
        SELECT g.id 
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1 AND g.class_id = $2
    `, [userId, groupInfo.class_id]);

    if (classGroupCheck.rows.length > 0) {
        throw new AppError('Student already belongs to another group in this class', 409);
    }
};

// --- CRUD OPERATIONS ---

export const getAllGroups = async (user, classId) => {
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    
    const validClassId = classId ? validateId(classId, 'class ID') : null;
    let query = '';
    const values = [];

    const baseSelect = `
        SELECT 
            g.id, 
            g.class_id, 
            c.name as class_name, 
            g.name, 
            g.created_at,
            COUNT(DISTINCT gm.user_id)::int as member_count,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', u.id,
                        'full_name', u.full_name,
                        'email', u.email,
                        'student_id', u.student_id,
                        'is_leader', gm.is_leader,
                        'joined_at', gm.joined_at
                    )
                ) FILTER (WHERE u.id IS NOT NULL), '[]'
            ) as members
        FROM groups g
        JOIN classes c ON g.class_id = c.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN users u ON gm.user_id = u.id
    `;

    if (user.role === 'ADMIN') {
        query = baseSelect;
        if (validClassId) {
            query += ' WHERE g.class_id = $1';
            values.push(validClassId);
        }
    } else if (user.role === 'TEACHER') {
        query = `${baseSelect} WHERE c.teacher_id = $1`;
        values.push(user.userId);
        if (validClassId) {
            query += ' AND g.class_id = $2';
            values.push(validClassId);
        }
    } else if (user.role === 'STUDENT') {
        query = `${baseSelect} WHERE g.id IN (SELECT group_id FROM group_members WHERE user_id = $1)`;
        values.push(user.userId);
        if (validClassId) {
            query += ' AND g.class_id = $2';
            values.push(validClassId);
        }
    } else {
        throw new AppError('Unsupported role', 403);
    }

    query += ' GROUP BY g.id, g.class_id, c.name, g.name, g.created_at ORDER BY g.created_at DESC';
    const result = await pool.query(query, values);
    return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        class: {
            id: row.class_id,
            name: row.class_name
        },
        created_at: row.created_at,
        member_count: row.member_count,
        members: Array.isArray(row.members) ? row.members : []
    }));
};

// IMPORTANT: Do NOT reorder authorization steps
// Security invariant: group must be validated before membership
const authorizeTeacher = (group, user) => {
    if (group.teacher_id !== user.userId) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
};

const authorizeStudent = (members, user) => {
    const isMember = members.some(m => m.id === user.userId);
    if (!isMember) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
};

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

export const getGroupById = async (id, user) => {
    // 1. Strict Input Validation
    const groupId = validateId(id, 'group ID');
    
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    
    // 2. Fetch Group Data (Query 1)
    const groupQuery = `
        SELECT g.id, g.name, g.class_id, g.created_at, c.name as class_name, c.teacher_id 
        FROM groups g 
        JOIN classes c ON g.class_id = c.id 
        WHERE g.id = $1
    `;
    const groupResult = await pool.query(groupQuery, [groupId]);
    
    // If group doesn't exist, throw immediately
    if (groupResult.rows.length === 0) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
    const group = groupResult.rows[0];
    
    // Validate Group Shape
    if (!group || !group.id || !group.teacher_id) {
        throw new AppError('Invalid group data structure from database', 500);
    }

    // Short-circuit authorization for TEACHER
    if (user.role === 'TEACHER') {
        authorizeTeacher(group, user);
    }

    // 3. Fetch Members Data (Query 2)
    const membersQuery = `
        SELECT u.id, u.full_name, u.email, gm.is_leader, gm.joined_at, gm.group_id 
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1
    `;
    const membersResult = await pool.query(membersQuery, [groupId]);
    
    // 4. Deterministic Deduplication & Data Integrity Check
    const deduplicatedMembers = [];
    const memberMap = new Map();
    for (const member of membersResult.rows) {
        if (!member.id || typeof member.is_leader !== 'boolean') {
            throw new AppError('Corrupted data: Group member missing required fields', 500);
        }
        if (member.group_id !== group.id) {
            throw new AppError('Data inconsistency: Member group ID mismatch', 500);
        }
        
        if (!memberMap.has(member.id)) {
            memberMap.set(member.id, member);
        } else {
            const existing = memberMap.get(member.id);
            if (existing.is_leader !== member.is_leader) {
                throw new AppError('Corrupted membership data: Conflicting roles for the same user', 500);
            }
        }
    }
    for (const member of memberMap.values()) {
        deduplicatedMembers.push({
            id: member.id,
            full_name: member.full_name,
            email: member.email,
            is_leader: member.is_leader,
            joined_at: member.joined_at
        });
    }

    // 5. Explicit Authorization for STUDENT
    if (user.role === 'STUDENT') {
        authorizeStudent(deduplicatedMembers, user);
    } else if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
        throw new AppError('Unsupported role', 403);
    }

    // 6. Normalize & Return
    return {
        id: group.id,
        name: group.name,
        teacherId: group.teacher_id, // Normalized output
        class: {
            id: group.class_id,
            name: group.class_name
        },
        created_at: group.created_at,
        members: deduplicatedMembers
    };
};

export const createGroup = async (classId, name, user) => {
    const validClassId = validateId(classId, 'class ID');
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Valid group name is required', 400);
    }
    
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    
    if (user.role !== 'TEACHER') {
        throw new AppError('Forbidden: Only teachers can create groups', 403);
    }
    
    const classCheck = await pool.query('SELECT teacher_id FROM classes WHERE id = $1', [validClassId]);
    if (classCheck.rows.length === 0) {
        throw new AppError('Class not found', 404);
    }
    if (classCheck.rows[0].teacher_id !== user.userId) {
        throw new AppError('Forbidden: You do not manage this class', 403);
    }
    
    return withTransaction(async (client) => {
        // Group uniqueness rule: 1 class has max 1 group with the same name
        const groupNameCheck = await client.query('SELECT 1 FROM groups WHERE class_id = $1 AND name = $2', [validClassId, name.trim()]);
        if (groupNameCheck.rows.length > 0) {
            throw new AppError('A group with this name already exists in the class', 409);
        }

        const query = `
            INSERT INTO groups (class_id, name)
            VALUES ($1, $2)
            RETURNING id, class_id, name, created_at;
        `;
        const result = await client.query(query, [validClassId, name.trim()]);
        return result.rows[0];
    }, 'REPEATABLE READ');
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

    return withTransaction(async (client) => {
        // 6. Insert Member
        const insertQuery = `
            INSERT INTO group_members (group_id, user_id, is_leader)
            VALUES ($1, $2, false)
            RETURNING group_id, user_id, is_leader, joined_at;
        `;
        const insertResult = await client.query(insertQuery, [groupId, userId]);
        return insertResult.rows[0];
    }, 'REPEATABLE READ');
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

    return withTransaction(async (client) => {
        // 5. Delete Member
        const deleteQuery = 'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2';
        await client.query(deleteQuery, [groupId, userId]);
        return true;
    }, 'REPEATABLE READ');
};

export const assignLeader = async (groupId, targetUserId, currentUser) => {
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

    return withTransaction(async (client) => {
        // 3. Check membership
        const memberCheck = await client.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 FOR UPDATE', [groupId, targetUserId]);
        if (memberCheck.rows.length === 0) {
            throw new AppError('Group member not found', 404);
        }

        // 4. Update
        await client.query('UPDATE group_members SET is_leader = false WHERE group_id = $1', [groupId]);
        await client.query('UPDATE group_members SET is_leader = true WHERE group_id = $1 AND user_id = $2', [groupId, targetUserId]);

        return {
            group_id: groupId,
            user_id: targetUserId,
            is_leader: true
        };
    }, 'REPEATABLE READ');
};

export const studentJoinGroup = async (groupId, studentId) => {
    const groupCheck = await pool.query('SELECT id, class_id FROM groups WHERE id = $1', [groupId]);
    if (groupCheck.rows.length === 0) {
        const error = new Error('Group not found');
        error.status = 404;
        throw error;
    }

    await checkStudentCanJoinGroup(groupCheck.rows[0], studentId);

    return withTransaction(async (client) => {
        const insertQuery = `
            INSERT INTO group_members (group_id, user_id, is_leader)
            VALUES ($1, $2, false)
            RETURNING group_id, user_id, is_leader, joined_at;
        `;
        const insertResult = await client.query(insertQuery, [groupId, studentId]);
        return insertResult.rows[0];
    }, 'REPEATABLE READ');
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

    return withTransaction(async (client) => {
        await client.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, studentId]);
        return true;
    }, 'REPEATABLE READ');
};
