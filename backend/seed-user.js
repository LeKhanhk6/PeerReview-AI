import pool from './src/config/db.js';
import bcrypt from 'bcrypt';

async function seed() {
    try {
        const roleRes = await pool.query(`
            INSERT INTO roles (name)
            VALUES ('STUDENT')
            ON CONFLICT (name)
            DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        `);
        const roleId = roleRes.rows[0].id;
        
        const hash = await bcrypt.hash('password123', 10);
        
        await pool.query(
            `
            INSERT INTO users
                (role_id, full_name, email, student_id, password_hash)
            VALUES
                ($1, 'Test User', 'test@test.com', '12345', $2)
            ON CONFLICT (email)
            DO UPDATE SET password_hash = $2
            `,
            [roleId, hash]
        );
        console.log('Seed done');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await pool.end();
    }
}

seed();
