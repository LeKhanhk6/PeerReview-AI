import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  console.log('Connected to DB');

  // Read database.md
  const dbMdPath = path.join(__dirname, '../../docs/Database.md');
  const dbMdContent = fs.readFileSync(dbMdPath, 'utf8');

  // Find the first block which contains the schema
  const firstBlockMatch = dbMdContent.match(/```([\s\S]*?)```/);
  
  if (firstBlockMatch) {
    const sqlToRun = firstBlockMatch[1].trim();
    if (sqlToRun.includes('CREATE TABLE')) {
       console.log('Executing schema script...');
       try {
         await client.query(sqlToRun);
         console.log('Schema setup completed successfully.');
       } catch (e) {
         console.error('Error executing schema:', e.message);
       }
    }
  }

  // Check tables
  const res = await client.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`);
  console.log('Tables in public schema:', res.rows.map(r => r.tablename));

  await client.end();
}

main().catch(console.error);
