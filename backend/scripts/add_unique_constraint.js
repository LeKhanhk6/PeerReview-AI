import pool from '../src/config/db.js';

const addUniqueConstraint = async () => {
    try {
        console.log('Adding UNIQUE constraint to submission_versions...');
        await pool.query(`
            ALTER TABLE submission_versions 
            ADD CONSTRAINT unique_submission_version UNIQUE (submission_id, version_number);
        `);
        console.log('Migration successful.');
    } catch (error) {
        console.error('Error in migration:', error);
    } finally {
        pool.end();
    }
};

addUniqueConstraint();
