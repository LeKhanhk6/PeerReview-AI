import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/db.util.js';

// --- CONSTANTS ---
const NOT_FOUND_MSG = 'Class not found or you do not have permission to view it';

// --- HELPER FUNCTIONS ---
const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const validateId = (id, fieldName = 'ID') => {
    // Expect UUID here
    if (!id || typeof id !== 'string') {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    return id;
};

// --- CRUD OPERATIONS ---

export const getAllClasses = async (user, pagination = { page: 1, limit: 10, offset: 0 }) => {
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    
    let query = `
        SELECT id, course_code, course_name, name, invite_code, semester, created_at, teacher_id
        FROM classes 
        WHERE deleted_at IS NULL
    `;
    const values = [];

    let countQuery = `
        SELECT COUNT(*)
        FROM classes 
        WHERE deleted_at IS NULL
    `;
    const countValues = [];

    if (user.role === 'TEACHER') {
        query += ' AND teacher_id = $1';
        countQuery += ' AND teacher_id = $1';
        values.push(user.userId);
        countValues.push(user.userId);
    } else if (user.role === 'STUDENT') {
        query = `
            SELECT c.id, c.course_code, c.course_name, c.name, c.invite_code, c.semester, c.created_at, c.teacher_id
            FROM classes c
            JOIN class_members cm ON c.id = cm.class_id
            WHERE cm.user_id = $1 AND c.deleted_at IS NULL
        `;
        countQuery = `
            SELECT COUNT(*)
            FROM classes c
            JOIN class_members cm ON c.id = cm.class_id
            WHERE cm.user_id = $1 AND c.deleted_at IS NULL
        `;
        values.push(user.userId);
        countValues.push(user.userId);
    }
    
    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count, 10);
    
    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(pagination.limit, pagination.offset);
    
    const result = await pool.query(query, values);
    
    return {
        data: result.rows,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
    };
};

export const getClassById = async (id, user) => {
    const classId = validateId(id, 'class ID');
    
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    
    const query = `
        SELECT id, course_code, course_name, name, invite_code, semester, created_at, teacher_id
        FROM classes 
        WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [classId]);
    
    if (result.rows.length === 0) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
    const classData = result.rows[0];
    
    if (user.role === 'TEACHER' && classData.teacher_id !== user.userId) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
    
    if (user.role === 'STUDENT') {
        const memberCheck = await pool.query('SELECT 1 FROM class_members WHERE class_id = $1 AND user_id = $2', [classId, user.userId]);
        if (memberCheck.rows.length === 0) {
            throw new AppError(NOT_FOUND_MSG, 404);
        }
    }
    
    return classData;
};

export const createClass = async (classData, user) => {
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
        throw new AppError('Forbidden: Only teachers or admins can create classes', 403);
    }
    
    return withTransaction(async (client) => {
        let inviteCode = generateInviteCode();
        let retryCount = 0;
        let isUnique = false;
        
        while (!isUnique && retryCount < 5) {
            const check = await client.query('SELECT 1 FROM classes WHERE invite_code = $1', [inviteCode]);
            if (check.rows.length === 0) {
                isUnique = true;
            } else {
                inviteCode = generateInviteCode();
                retryCount++;
            }
        }
        
        if (!isUnique) {
            throw new AppError('Failed to generate unique invite code. Please try again.', 500);
        }

        const query = `
            INSERT INTO classes (teacher_id, course_code, course_name, name, semester, invite_code)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, course_code, course_name, name, invite_code, semester, created_at, teacher_id;
        `;
        const result = await client.query(query, [
            user.userId,
            classData.course_code.trim(),
            classData.course_name.trim(),
            classData.name.trim(),
            classData.semester ? classData.semester.trim() : null,
            inviteCode
        ]);
        return result.rows[0];
    });
};

export const updateClass = async (id, updateData, user) => {
    const classId = validateId(id, 'class ID');
    
    const classData = await getClassById(classId, user); // checks ownership and existence

    if (user.role === 'TEACHER' && classData.teacher_id !== user.userId) {
        throw new AppError('Forbidden: You do not manage this class', 403);
    }

    const query = `
        UPDATE classes 
        SET course_code = COALESCE($1, course_code),
            course_name = COALESCE($2, course_name),
            name = COALESCE($3, name),
            semester = COALESCE($4, semester)
        WHERE id = $5 AND deleted_at IS NULL
        RETURNING id, course_code, course_name, name, invite_code, semester, created_at, teacher_id;
    `;
    const result = await pool.query(query, [
        updateData.course_code ? updateData.course_code.trim() : null,
        updateData.course_name ? updateData.course_name.trim() : null,
        updateData.name ? updateData.name.trim() : null,
        updateData.semester ? updateData.semester.trim() : null,
        classId
    ]);
    
    return result.rows[0];
};

export const deleteClass = async (id, user) => {
    const classId = validateId(id, 'class ID');
    
    const classData = await getClassById(classId, user);

    if (user.role === 'TEACHER' && classData.teacher_id !== user.userId) {
        throw new AppError('Forbidden: You do not manage this class', 403);
    }

    const query = `
        UPDATE classes 
        SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
    `;
    await pool.query(query, [classId]);
    
    return true;
};

export const getClassMembers = async (id, user) => {
    const classId = validateId(id, 'class ID');
    
    // Validate ownership
    await getClassById(classId, user);
    
    const query = `
        SELECT u.id, u.full_name, u.email, u.student_id, cm.joined_at, cm.role
        FROM class_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.class_id = $1
        ORDER BY cm.joined_at ASC
    `;
    const result = await pool.query(query, [classId]);
    return result.rows;
};

export const joinClassByInviteCode = async (inviteCode, user) => {
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    
    if (user.role !== 'STUDENT') {
        throw new AppError('Only students can join classes', 403);
    }
    
    if (!inviteCode || typeof inviteCode !== 'string') {
        throw new AppError('Invalid invite code', 400);
    }

    return withTransaction(async (client) => {
        // Find class by invite code
        const classResult = await client.query(
            'SELECT id, name FROM classes WHERE invite_code = $1 AND deleted_at IS NULL', 
            [inviteCode.trim()]
        );
        
        if (classResult.rows.length === 0) {
            throw new AppError('Lớp không tồn tại hoặc đã bị đóng', 404);
        }
        
        const targetClass = classResult.rows[0];
        
        // Check uniqueness
        const membershipCheck = await client.query(
            'SELECT 1 FROM class_members WHERE class_id = $1 AND user_id = $2',
            [targetClass.id, user.userId]
        );
        
        if (membershipCheck.rows.length > 0) {
            throw new AppError('Bạn đã ở trong lớp này', 409);
        }
        
        const insertQuery = `
            INSERT INTO class_members (class_id, user_id, role)
            VALUES ($1, $2, 'STUDENT')
            RETURNING class_id, user_id, role, joined_at;
        `;
        await client.query(insertQuery, [targetClass.id, user.userId]);
        
        return {
            class_id: targetClass.id,
            name: targetClass.name
        };
    });
};
