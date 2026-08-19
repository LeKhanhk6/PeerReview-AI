import pool from '../config/db.js';

export const getRubricAndCriteria = async (assignmentId) => {
    const rubricQuery = 'SELECT id, assignment_id, description, created_at FROM rubrics WHERE assignment_id = $1';
    const rubricRes = await pool.query(rubricQuery, [assignmentId]);
    if (rubricRes.rows.length === 0) {
        return null;
    }
    const rubric = rubricRes.rows[0];

    const criteriaQuery = 'SELECT id, name, description, weight, created_at FROM rubric_criteria WHERE rubric_id = $1 ORDER BY created_at ASC';
    const criteriaRes = await pool.query(criteriaQuery, [rubric.id]);
    
    return {
        ...rubric,
        criteria: criteriaRes.rows
    };
};

const normalizeOptionalString = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    return value.trim();
};

export const saveRubric = async (assignmentId, description, criteriaArray) => {
    const client = await pool.connect();
    let transactionStarted = false;
    try {
        await client.query('BEGIN');
        transactionStarted = true;

        const rubricDescription = normalizeOptionalString(description);

        const rubricCheck = await client.query('SELECT id FROM rubrics WHERE assignment_id = $1', [assignmentId]);
        let rubricId;

        if (rubricCheck.rows.length > 0) {
            rubricId = rubricCheck.rows[0].id;
            await client.query('UPDATE rubrics SET description = $1 WHERE id = $2', [rubricDescription, rubricId]);
            await client.query('DELETE FROM rubric_criteria WHERE rubric_id = $1', [rubricId]);
        } else {
            const insertRubric = await client.query(
                'INSERT INTO rubrics (assignment_id, description) VALUES ($1, $2) RETURNING id',
                [assignmentId, rubricDescription]
            );
            rubricId = insertRubric.rows[0].id;
        }

        for (const criteria of criteriaArray) {
            const criteriaDescription = normalizeOptionalString(criteria.description);
            await client.query(
                'INSERT INTO rubric_criteria (rubric_id, name, description, weight) VALUES ($1, $2, $3, $4)',
                [rubricId, criteria.name.trim(), criteriaDescription, criteria.weight]
            );
        }

        await client.query('COMMIT');

        return await getRubricAndCriteria(assignmentId);
    } catch (error) {
        if (transactionStarted) {
            await client.query('ROLLBACK');
        }
        throw error;
    } finally {
        client.release();
    }
};
