import pool from './src/config/db.js';

async function run() {
  const result = await pool.query(`
    SELECT file_url FROM submission_versions ORDER BY created_at DESC LIMIT 5
  `);
  console.log(result.rows);
  process.exit(0);
}

run();
