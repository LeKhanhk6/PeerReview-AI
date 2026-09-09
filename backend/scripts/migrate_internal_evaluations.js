import pool, { connectDB } from '../src/config/db.js';

async function migrate() {
    await connectDB();
    const client = await pool.connect();
    try {
        console.log('Starting migration for internal_evaluations...');
        await client.query('BEGIN');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS internal_evaluations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
                assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
                evaluator_id UUID REFERENCES users(id) ON DELETE CASCADE,
                evaluatee_id UUID REFERENCES users(id) ON DELETE CASCADE,
                c2_score INT CHECK (c2_score BETWEEN 1 AND 5),
                c3_score INT CHECK (c3_score BETWEEN 1 AND 5),
                c4_score INT CHECK (c4_score BETWEEN 1 AND 5),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(assignment_id, evaluator_id, evaluatee_id),
                CHECK (evaluator_id <> evaluatee_id)
            );
        `);

        // Create trigger for updated_at if not exists
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column_internal_evals()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Note: DROP TRIGGER IF EXISTS prevents error on rerun
        await client.query(`
            DROP TRIGGER IF EXISTS update_internal_evaluations_updated_at ON internal_evaluations;
            CREATE TRIGGER update_internal_evaluations_updated_at
            BEFORE UPDATE ON internal_evaluations
            FOR EACH ROW
            WHEN (OLD IS DISTINCT FROM NEW)
            EXECUTE FUNCTION update_updated_at_column_internal_evals();
        `);

        await client.query('COMMIT');
        console.log('Migration successful: internal_evaluations table created.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
