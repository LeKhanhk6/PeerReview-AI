import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    const result = await pool.query(`
        SELECT u.id, u.email, r.name as role 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.email = $1
    `, ['teacher@gmail.com']);
    
    console.log(result.rows[0]);
    
    if (result.rows.length > 0 && result.rows[0].role !== 'TEACHER') {
      await pool.query(`
        UPDATE users 
        SET role_id = (SELECT id FROM roles WHERE name = 'TEACHER') 
        WHERE email = $1
      `, ['teacher@gmail.com']);
      console.log('Role updated to TEACHER');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
