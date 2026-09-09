import pool from './src/config/db.js';

(async () => {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'groups'");
    console.log(res.rows);
    process.exit(0);
})();
