import pool from '../src/config/db.js';

const addSubmissionIndex = async () => {
    try {
        console.log('Adding index to submission_versions...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_submission_versions_submission_version 
            ON submission_versions(submission_id, version_number DESC);
        `);
        console.log('Migration successful.');
    } catch (error) {
        console.error('Error in migration:', error);
    } finally {
        pool.end();
    }
};

addSubmissionIndex();
