import pool from '../src/config/db.js';

const addIndex = async () => {
    try {
        console.log('Adding index to submission_versions...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_submission_versions_submission_created
            ON submission_versions(submission_id, created_at DESC);
        `);
        console.log('Adding index to group_members...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_group_members_user
            ON group_members(user_id);
            CREATE INDEX IF NOT EXISTS idx_group_members_user_group
            ON group_members(user_id, group_id);
        `);
        console.log('Adding index to review_assignments...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_review_assignments_submission
            ON review_assignments(submission_id);
        `);
        console.log('Adding index to assignments and groups...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_assignments_class
            ON assignments(class_id);
            CREATE INDEX IF NOT EXISTS idx_groups_class
            ON groups(class_id);
        `);
        console.log('Index added successfully.');
    } catch (error) {
        console.error('Error adding index:', error);
    } finally {
        pool.end();
    }
};

addIndex();
