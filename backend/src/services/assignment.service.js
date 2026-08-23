import pool from '../config/db.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.util.js';

const NOT_FOUND_MSG = 'Assignment not found or you do not have permission to access it';

const validateId = (id, fieldName = 'ID') => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }
    return numericId;
};

// --- EXISTENCE & OWNERSHIP CHECKS ---

export const getClassOwnershipInfo = async (classId) => {
    const query = 'SELECT id, teacher_id FROM classes WHERE id = $1';
    const result = await pool.query(query, [classId]);
    return result.rows[0];
};

export const getAssignmentOwnershipInfo = async (assignmentId) => {
    const query = `
        SELECT a.id, c.teacher_id 
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
    `;
    const result = await pool.query(query, [assignmentId]);
    return result.rows[0];
};

// --- CRUD OPERATIONS ---

export const getAllAssignments = async (user, classId) => {
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }

    let query = '';
    const values = [];

    if (user.role === 'ADMIN') {
        query = 'SELECT id, class_id, title, description, requirements, deadline, created_at FROM assignments';
        if (classId) {
            query += ' WHERE class_id = $1';
            values.push(classId);
        }
    } else if (user.role === 'TEACHER') {
        query = `
            SELECT a.id, a.class_id, a.title, a.description, a.requirements, a.deadline, a.created_at 
            FROM assignments a 
            JOIN classes c ON a.class_id = c.id 
            WHERE c.teacher_id = $1
        `;
        values.push(user.userId);
        if (classId) {
            query += ' AND a.class_id = $2';
            values.push(classId);
        }
    } else if (user.role === 'STUDENT') {
        query = `
            SELECT DISTINCT a.id, a.class_id, a.title, a.description, a.requirements, a.deadline, a.created_at 
            FROM assignments a 
            JOIN groups g ON a.class_id = g.class_id 
            JOIN group_members gm ON g.id = gm.group_id 
            WHERE gm.user_id = $1
        `;
        values.push(user.userId);
        if (classId) {
            query += ' AND a.class_id = $2';
            values.push(classId);
        }
    } else {
        throw new AppError('Unsupported role', 403);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
};

export const getAssignmentById = async (id, user) => {
    const validId = validateId(id, 'assignment ID');
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }

    let query = '';
    const values = [validId];

    if (user.role === 'ADMIN') {
        query = 'SELECT * FROM assignments WHERE id = $1';
    } else if (user.role === 'TEACHER') {
        query = `
            SELECT a.* FROM assignments a 
            JOIN classes c ON a.class_id = c.id 
            WHERE a.id = $1 AND c.teacher_id = $2
        `;
        values.push(user.userId);
    } else if (user.role === 'STUDENT') {
        query = `
            SELECT DISTINCT a.* FROM assignments a 
            JOIN groups g ON a.class_id = g.class_id 
            JOIN group_members gm ON g.id = gm.group_id 
            WHERE a.id = $1 AND gm.user_id = $2
        `;
        values.push(user.userId);
    } else {
        throw new AppError('Unsupported role', 403);
    }

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
    return result.rows[0];
};

export const createAssignment = async (assignmentData, user) => {
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    if (user.role !== 'TEACHER') {
        throw new AppError('Forbidden: Only teachers can create assignments', 403);
    }

    const { class_id, title, description, requirements, deadline } = assignmentData;
    const validClassId = validateId(class_id, 'class ID');
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new AppError('Valid title is required', 400);
    }

    // Verify ownership of the class
    const classOwnership = await getClassOwnershipInfo(validClassId);
    if (!classOwnership) {
        throw new AppError('Class not found', 404);
    }
    if (classOwnership.teacher_id !== user.userId) {
        throw new AppError('Forbidden: You do not manage this class', 403);
    }

    const query = `
        INSERT INTO assignments (class_id, title, description, requirements, deadline)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, class_id, title, description, requirements, deadline, created_at;
    `;
    const values = [validClassId, title.trim(), description, requirements, deadline];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const updateAssignment = async (id, assignmentData, user) => {
    const validId = validateId(id, 'assignment ID');
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    if (user.role !== 'TEACHER') {
        throw new AppError('Forbidden: Only teachers can update assignments', 403);
    }

    // Check ownership
    const assignmentOwnership = await getAssignmentOwnershipInfo(validId);
    if (!assignmentOwnership) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
    if (assignmentOwnership.teacher_id !== user.userId) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }

    const { title, description, requirements, deadline } = assignmentData;
    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new AppError('Valid title is required', 400);
    }

    const query = `
        UPDATE assignments
        SET title = $1, description = $2, requirements = $3, deadline = $4
        WHERE id = $5
        RETURNING id, class_id, title, description, requirements, deadline, created_at;
    `;
    const values = [title.trim(), description, requirements, deadline, validId];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
    return result.rows[0];
};

export const deleteAssignment = async (id, user) => {
    const validId = validateId(id, 'assignment ID');
    if (!user || !user.role || !user.userId) {
        throw new AppError('Invalid user context', 400);
    }
    if (user.role !== 'TEACHER') {
        throw new AppError('Forbidden: Only teachers can delete assignments', 403);
    }

    // Check ownership
    const assignmentOwnership = await getAssignmentOwnershipInfo(validId);
    if (!assignmentOwnership) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
    if (assignmentOwnership.teacher_id !== user.userId) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }

    const query = 'DELETE FROM assignments WHERE id = $1 RETURNING id;';
    const result = await pool.query(query, [validId]);

    if (result.rowCount === 0) {
        throw new AppError('Assignment not found', 404);
    }
    return true;
};

// --- TASK 06.2 ASSIGNMENT DETAIL ---

export const getAssignmentBasic = async (id, user) => {
    let query = '';
    const values = [id];

    if (user.role === 'ADMIN') {
        query = 'SELECT * FROM assignments WHERE id = $1';
    } else if (user.role === 'TEACHER') {
        query = `
            SELECT a.* FROM assignments a 
            JOIN classes c ON a.class_id = c.id 
            WHERE a.id = $1 AND c.teacher_id = $2
        `;
        values.push(user.userId);
    } else if (user.role === 'STUDENT') {
        query = `
            SELECT DISTINCT a.* FROM assignments a 
            JOIN groups g ON a.class_id = g.class_id 
            JOIN group_members gm ON g.id = gm.group_id 
            WHERE a.id = $1 AND gm.user_id = $2
        `;
        values.push(user.userId);
    } else {
        const error = new Error('Unsupported role');
        error.status = 403;
        throw error;
    }

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
        // If the assignment exists in the db at all, but not for this user -> 403
        // If it doesn't exist at all -> 404
        const checkExists = await pool.query('SELECT id FROM assignments WHERE id = $1', [id]);
        const error = new Error(checkExists.rows.length > 0 ? 'Forbidden access to this assignment' : 'Assignment not found');
        error.status = checkExists.rows.length > 0 ? 403 : 404;
        throw error;
    }
    return result.rows[0];
};

export const getRubricByAssignmentId = async (assignmentId) => {
    const query = `
        SELECT r.id as rubric_id, r.description as rubric_description, 
               rc.id as criteria_id, rc.name, rc.description as criteria_description, rc.weight
        FROM rubrics r
        LEFT JOIN rubric_criteria rc ON rc.rubric_id = r.id
        WHERE r.assignment_id = $1
        ORDER BY rc.created_at ASC
    `;
    const result = await pool.query(query, [assignmentId]);
    
    if (result.rows.length === 0) return null;
    
    const rubric = {
        id: result.rows[0].rubric_id,
        description: result.rows[0].rubric_description,
        criteria: []
    };

    if (result.rows[0].criteria_id) {
        rubric.criteria = result.rows.map(row => ({
            id: row.criteria_id,
            name: row.name,
            description: row.criteria_description,
            weight: row.weight
        }));
    }
    
    return rubric;
};

export const getAttachmentsByAssignmentId = async (assignmentId) => {
    const query = 'SELECT id, file_name, file_url, file_type, file_size, created_at FROM assignment_attachments WHERE assignment_id = $1 ORDER BY created_at ASC LIMIT 50 OFFSET 0';
    const result = await pool.query(query, [assignmentId]);
    return result.rows;
};

export const getAssignmentDetailById = async (id, user) => {
    try {
        const validId = validateId(id, 'assignment ID');
        logger.info({ event: 'assignment_detail_start', assignmentId: validId });
        
        // 1. Get basic assignment + check authorization (Fail-fast)
        const assignment = await getAssignmentBasic(id, user); // This will throw 403 or 404 if invalid

        // 2. Fetch optional parts with graceful degradation
        const [rubric, attachments] = await Promise.all([
            getRubricByAssignmentId(id).catch(err => {
                logger.error({ event: 'rubric_fetch_error', assignmentId: id, error: err.message });
                return null;
            }),
            getAttachmentsByAssignmentId(id).catch(err => {
                logger.error({ event: 'attachments_fetch_error', assignmentId: id, error: err.message });
                return [];
            })
        ]);

        const now = new Date().getTime();
        const deadline = new Date(assignment.deadline).getTime();
        const is_overdue = deadline < now;
        const time_left_days = Math.max(0, Math.ceil((deadline - now) / 86400000));
        const deadline_status = is_overdue ? 'OVERDUE' : 'UPCOMING';
        const assignment_status = is_overdue ? 'CLOSED' : 'ACTIVE';
        
        let total_criteria_weight = 0;
        if (rubric && rubric.criteria) {
            total_criteria_weight = rubric.criteria.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
        }

        logger.info({ event: 'assignment_detail_end', assignmentId: validId });

        return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            requirements: assignment.requirements,
            deadline: assignment.deadline,
            is_overdue,
            time_left_days,
            deadline_status,
            assignment_status,
            can_submit: !is_overdue,
            has_attachments: attachments.length > 0,
            has_rubric: !!rubric,
            total_criteria_weight,
            criteria_count: rubric?.criteria?.length || 0,
            rubric,
            attachments
        };
    } catch (err) {
        const error = new Error(err.message || 'Failed to fetch assignment detail');
        error.status = err.status || 500;
        error.originalError = err;
        throw error;
    }
};