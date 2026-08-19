import pool from './src/config/db.js';
import bcrypt from 'bcrypt';

async function seed() {
    try {
        // Seed Roles
        const roles = ['STUDENT', 'ADMIN', 'TEACHER'];
        for (const r of roles) {
            await pool.query(`
                INSERT INTO roles (name)
                VALUES ($1)
                ON CONFLICT (name)
                DO UPDATE SET name = EXCLUDED.name
            `, [r]);
        }
        
        // Get Role IDs
        const rolesRes = await pool.query(`SELECT id, name FROM roles`);
        const roleMap = {};
        rolesRes.rows.forEach(r => roleMap[r.name] = r.id);
        
        for (const role of roles) {
            if (!roleMap[role]) {
                throw new Error(`Role ${role} was not found after seeding`);
            }
        }
        
        const hash = await bcrypt.hash('password123', 10);
        
        // Seed STUDENT
        await pool.query(`
            INSERT INTO users (role_id, full_name, email, student_id, password_hash)
            VALUES ($1, 'Student User', 'test@student.com', 'STUDENT_TEST', $2)
            ON CONFLICT (email)
            DO UPDATE SET 
                role_id = EXCLUDED.role_id,
                full_name = EXCLUDED.full_name,
                student_id = EXCLUDED.student_id,
                password_hash = EXCLUDED.password_hash
        `, [roleMap['STUDENT'], hash]);

        // Seed ADMIN
        await pool.query(`
            INSERT INTO users (role_id, full_name, email, student_id, password_hash)
            VALUES ($1, 'Admin User', 'test@admin.com', NULL, $2)
            ON CONFLICT (email)
            DO UPDATE SET 
                role_id = EXCLUDED.role_id,
                full_name = EXCLUDED.full_name,
                student_id = EXCLUDED.student_id,
                password_hash = EXCLUDED.password_hash
        `, [roleMap['ADMIN'], hash]);

        // Seed TEACHER
        await pool.query(`
            INSERT INTO users (role_id, full_name, email, student_id, password_hash)
            VALUES ($1, 'Teacher User', 'test@teacher.com', NULL, $2)
            ON CONFLICT (email)
            DO UPDATE SET 
                role_id = EXCLUDED.role_id,
                full_name = EXCLUDED.full_name,
                student_id = EXCLUDED.student_id,
                password_hash = EXCLUDED.password_hash
        `, [roleMap['TEACHER'], hash]);

        console.log('Seed done: Created STUDENT, ADMIN, TEACHER');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await pool.end();
    }
}
seed();
