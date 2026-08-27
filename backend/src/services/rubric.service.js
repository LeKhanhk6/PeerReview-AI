import pool from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/db.util.js';

const NOT_FOUND_MSG = 'Rubric not found or you do not have permission to access it';

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

const verifyTeacherOwnership = async (assignmentId, userId) => {
    const query = `
        SELECT a.id, c.teacher_id 
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
    `;
    const result = await pool.query(query, [assignmentId]);
    if (!result || !Array.isArray(result.rows) || result.rows.length === 0) {
        throw new AppError('Assignment not found', 404);
    }
    if (result.rows[0].teacher_id !== userId) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
};

const validateRubricCriteria = (criteriaArray) => {
    if (!Array.isArray(criteriaArray) || criteriaArray.length === 0) {
        throw new AppError('Rubric must have at least one criterion', 400);
    }

    let totalWeight = 0;
    const names = new Set();

    for (const criteria of criteriaArray) {
        if (!criteria.name || typeof criteria.name !== 'string' || criteria.name.trim() === '') {
            throw new AppError('Criteria name is required', 400);
        }
        
        const nameTrimmed = criteria.name.trim().toLowerCase();
        if (names.has(nameTrimmed)) {
            throw new AppError('Duplicate criteria names are not allowed', 400);
        }
        names.add(nameTrimmed);

        if (criteria.description !== undefined && criteria.description !== null && typeof criteria.description !== 'string') {
            throw new AppError('Invalid criteria description', 400);
        }

        const weight = Number(criteria.weight);
        if (isNaN(weight) || weight <= 0 || weight > 100) {
            throw new AppError('Criteria weight must be a positive number up to 100', 400);
        }
        totalWeight += weight;
    }

    if (Math.round(totalWeight * 100) / 100 !== 100) {
        throw new AppError('Total weight of criteria must equal exactly 100', 400);
    }
};

export const getRubricAndCriteria = async (assignmentId, user) => {
    const validId = validateId(assignmentId, 'assignment ID');

    // Auth check: Is the user a teacher owning it, or a student in the group?
    if (user.role === 'STUDENT') {
        const authQuery = `
            SELECT 1 FROM assignments a
            JOIN groups g ON g.class_id = a.class_id
            JOIN group_members gm ON gm.group_id = g.id
            WHERE a.id = $1 AND gm.user_id = $2
        `;
        const authRes = await pool.query(authQuery, [validId, user.userId]);
        if (authRes.rows.length === 0) {
            throw new AppError(NOT_FOUND_MSG, 404);
        }
    } else if (user.role === 'TEACHER') {
        await verifyTeacherOwnership(validId, user.userId);
    } else if (user.role !== 'ADMIN') {
        throw new AppError('Unsupported role', 403);
    }

    const rubricQuery = 'SELECT id, assignment_id, description, created_at FROM rubrics WHERE assignment_id = $1';
    const rubricRes = await pool.query(rubricQuery, [validId]);
    if (!rubricRes || !Array.isArray(rubricRes.rows)) {
        throw new AppError('Invalid DB response', 500);
    }
    if (rubricRes.rows.length === 0) {
        throw new AppError(NOT_FOUND_MSG, 404);
    }
    const rubric = rubricRes.rows[0];
    if (!rubric || !rubric.id) {
        throw new AppError('Corrupted rubric data', 500);
    }

    const criteriaQuery = 'SELECT id, name, description, weight, created_at FROM rubric_criteria WHERE rubric_id = $1 ORDER BY created_at ASC';
    const criteriaRes = await pool.query(criteriaQuery, [rubric.id]);
    const criteria = criteriaRes && Array.isArray(criteriaRes.rows) ? criteriaRes.rows : [];
    
    return {
        ...rubric,
        criteria
    };
};

const normalizeOptionalString = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    return typeof value === 'string' ? value.trim() : null;
};

export const saveRubric = async (assignmentId, description, criteriaArray, user) => {
    const validId = validateId(assignmentId, 'assignment ID');
    
    if (!user || user.role !== 'TEACHER') {
        throw new AppError('Forbidden: Only teachers can manage rubrics', 403);
    }
    
    // Validate input strictly before any DB operations to allow short-circuiting
    validateRubricCriteria(criteriaArray);
    
    await verifyTeacherOwnership(validId, user.userId);

    return withTransaction(async (client) => {
        const rubricDescription = normalizeOptionalString(description);

        const rubricCheck = await client.query('SELECT id FROM rubrics WHERE assignment_id = $1 FOR UPDATE', [validId]);
        let rubricId;

        if (rubricCheck.rows.length > 0) {
            rubricId = rubricCheck.rows[0].id;
            await client.query('UPDATE rubrics SET description = $1 WHERE id = $2', [rubricDescription, rubricId]);
            await client.query('DELETE FROM rubric_criteria WHERE rubric_id = $1', [rubricId]);
        } else {
            const insertRubric = await client.query(
                'INSERT INTO rubrics (assignment_id, description) VALUES ($1, $2) RETURNING id',
                [validId, rubricDescription]
            );
            rubricId = insertRubric.rows[0].id;
        }

        for (const criteria of criteriaArray) {
            const criteriaDescription = normalizeOptionalString(criteria.description);
            await client.query(
                'INSERT INTO rubric_criteria (rubric_id, name, description, weight) VALUES ($1, $2, $3, $4)',
                [rubricId, criteria.name.trim(), criteriaDescription, Number(criteria.weight)]
            );
        }
        
        // We can just fetch it manually to avoid auth-check loop in getRubricAndCriteria
        const criteriaRes = await client.query('SELECT id, name, description, weight, created_at FROM rubric_criteria WHERE rubric_id = $1 ORDER BY created_at ASC', [rubricId]);
        return {
            id: rubricId,
            assignment_id: validId,
            description: rubricDescription,
            criteria: criteriaRes.rows
        };
    }, 'REPEATABLE READ');
};

export const deleteRubric = async (assignmentId, user) => {
    const validId = validateId(assignmentId, 'assignment ID');
    
    if (!user || user.role !== 'TEACHER') {
        throw new AppError('Forbidden: Only teachers can manage rubrics', 403);
    }
    await verifyTeacherOwnership(validId, user.userId);

    return withTransaction(async (client) => {
        const rubricCheck = await client.query('SELECT id FROM rubrics WHERE assignment_id = $1 FOR UPDATE', [validId]);
        if (rubricCheck.rows.length === 0) {
            throw new AppError(NOT_FOUND_MSG, 404);
        }

        // Check if in use (e.g., are there any submissions for this assignment?)
        const inUseCheck = await client.query('SELECT id FROM submissions WHERE assignment_id = $1 LIMIT 1', [validId]);
        if (inUseCheck.rows.length > 0) {
            throw new AppError('Cannot delete rubric because submissions already exist for this assignment', 400);
        }

        await client.query('DELETE FROM rubrics WHERE assignment_id = $1', [validId]); // Cascade deletes criteria
        return true;
    }, 'REPEATABLE READ');
};
