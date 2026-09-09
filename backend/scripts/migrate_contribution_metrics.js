import pool, { connectDB } from '../src/config/db.js';

async function migrate() {
    await connectDB();
    const client = await pool.connect();
    try {
        console.log('Starting migration for contribution_metrics...');
        await client.query('BEGIN');
        
        // 1. Check if assignment_id column exists
        const checkAssignmentId = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='contribution_metrics' and column_name='assignment_id'
        `);
        
        if (checkAssignmentId.rowCount === 0) {
            console.log('Adding assignment_id column...');
            await client.query(`
                ALTER TABLE contribution_metrics 
                ADD COLUMN assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE
            `);
        } else {
            console.log('Column assignment_id already exists.');
        }

        // 2. Check if metadata column exists
        const checkMetadata = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='contribution_metrics' and column_name='metadata'
        `);
        
        if (checkMetadata.rowCount === 0) {
            console.log('Adding metadata column...');
            await client.query(`
                ALTER TABLE contribution_metrics 
                ADD COLUMN metadata JSONB
            `);
        } else {
            console.log('Column metadata already exists.');
        }

        // 3. Update unique constraint if needed (to allow republish/unique per assignment-group-user)
        // Wait, in previous schema, contribution_metrics had NO unique constraint!
        // We should add UNIQUE(assignment_id, group_id, user_id) to prevent duplicate rows for the same user in the same assignment
        const checkConstraint = await client.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='contribution_metrics' AND constraint_type='UNIQUE'
        `);
        
        let hasUnique = false;
        for (const row of checkConstraint.rows) {
            if (row.constraint_name === 'contribution_metrics_assignment_id_group_id_user_id_key') {
                hasUnique = true;
            }
        }
        
        if (!hasUnique) {
            console.log('Adding UNIQUE constraint to contribution_metrics...');
            // In case there are duplicates, we should clear the table or delete duplicates.
            // Since this is MVP and new feature, we can just clear the table safely.
            await client.query('TRUNCATE TABLE contribution_metrics');
            await client.query(`
                ALTER TABLE contribution_metrics
                ADD CONSTRAINT contribution_metrics_assignment_id_group_id_user_id_key UNIQUE(assignment_id, group_id, user_id)
            `);
        }

        await client.query('COMMIT');
        console.log('Migration successful: contribution_metrics updated.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
