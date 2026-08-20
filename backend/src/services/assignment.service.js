import pool from '../config/db.js';

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
        // ASSUMPTION: Student được xác định thuộc Class thông qua Group Membership
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
        const error = new Error('Unsupported role');
        error.status = 403;
        throw error;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
};

export const getAssignmentById = async (id, user) => {
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
        const error = new Error('Assignment not found or you do not have permission to access it');
        error.status = 404;
        throw error;
    }
    return result.rows[0];
};

export const createAssignment = async (assignmentData) => {
    const { class_id, title, description, requirements, deadline } = assignmentData;
    const query = `
        INSERT INTO assignments (class_id, title, description, requirements, deadline)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, class_id, title, description, requirements, deadline, created_at;
    `;
    const values = [class_id, title, description, requirements, deadline];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const updateAssignment = async (id, assignmentData) => {
    const { title, description, requirements, deadline } = assignmentData;
    const query = `
        UPDATE assignments
        SET title = $1, description = $2, requirements = $3, deadline = $4
        WHERE id = $5
        RETURNING id, class_id, title, description, requirements, deadline, created_at;
    `;
    const values = [title, description, requirements, deadline, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
        const error = new Error('Assignment not found');
        error.status = 404;
        throw error;
    }
    return result.rows[0];
};

export const deleteAssignment = async (id) => {
    const query = 'DELETE FROM assignments WHERE id = $1 RETURNING id;';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        const error = new Error('Assignment not found');
        error.status = 404;
        throw error;
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
    const query = 'SELECT id, file_name, file_url, file_type, file_size, created_at FROM assignment_attachments WHERE assignment_id = $1 ORDER BY created_at ASC LIMIT 50';
    const result = await pool.query(query, [assignmentId]);
    return result.rows;
};

export const getAssignmentDetailById = async (id, user) => {
    try {
        console.time('assignment_detail');
        
        // 1. Get basic assignment + check authorization
        // Isolated Promise.all for graceful degradation of optional parts
        const [assignment, rubric, attachments] = await Promise.all([
            getAssignmentBasic(id, user), // This will throw 403 or 404 if invalid
            getRubricByAssignmentId(id).catch(err => {
                console.error('Error fetching rubric:', err);
                return null;
            }),
            getAttachmentsByAssignmentId(id).catch(err => {
                console.error('Error fetching attachments:', err);
                return [];
            })
        ]);

        const now = new Date();
        const deadline = new Date(assignment.deadline);
        const is_overdue = deadline < now;
        const time_left_days = Math.max(0, Math.ceil((deadline - now) / 86400000));
        const deadline_status = is_overdue ? 'OVERDUE' : 'UPCOMING';
        
        let total_criteria_weight = 0;
        if (rubric && rubric.criteria) {
            total_criteria_weight = rubric.criteria.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
        }

        console.timeEnd('assignment_detail');

        return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            requirements: assignment.requirements,
            deadline: assignment.deadline,
            is_overdue,
            time_left_days,
            deadline_status,
            has_attachments: attachments.length > 0,
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