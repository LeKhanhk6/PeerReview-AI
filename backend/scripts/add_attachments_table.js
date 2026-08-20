import pool from '../src/config/db.js';

const addAttachmentsTable = async () => {
    try {
        console.log('Creating assignment_attachments table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assignment_attachments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
                file_name TEXT NOT NULL,
                file_url TEXT NOT NULL,
                file_type VARCHAR(50),
                file_size INT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('Adding index to assignment_attachments...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_assignment_attachments_assignment 
            ON assignment_attachments(assignment_id);
        `);
        
        console.log('Adding indexes to rubric tables...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_rubric_assignment ON rubrics(assignment_id);
            CREATE INDEX IF NOT EXISTS idx_rubric_criteria_rubric ON rubric_criteria(rubric_id);
        `);
        
        console.log('Migration successful.');
    } catch (error) {
        console.error('Error in migration:', error);
    } finally {
        pool.end();
    }
};

addAttachmentsTable();
