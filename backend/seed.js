import pg from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/peerreview_db';
const { Pool } = pg;
const pool = new Pool({ connectionString });

export async function seedTestData() {
  console.log('[E2E SEED] Starting idempotent E2E test data seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Seed Test Users (Admin, Teacher, Student01, Student02)
    const users = [
      { id: '11111111-1111-1111-1111-111111111111', email: 'admin@example.com', name: 'System Admin', role: 'ADMIN' },
      { id: '22222222-2222-2222-2222-222222222222', email: 'teacher01@example.com', name: 'Giảng viên A', role: 'TEACHER' },
      { id: '33333333-3333-3333-3333-333333333333', email: 'student01@example.com', name: 'Sinh viên 01', role: 'STUDENT' },
      { id: '44444444-4444-4444-4444-444444444444', email: 'student02@example.com', name: 'Sinh viên 02', role: 'STUDENT' },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
         ON CONFLICT (email) DO UPDATE SET 
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           status = 'ACTIVE'`,
        [u.id, u.email, passwordHash, u.name, u.role]
      );
    }

    console.log('[E2E SEED] Seeded test users successfully.');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[E2E SEED ERROR]', error);
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1].endsWith('seed.js')) {
  seedTestData().then(() => process.exit(0));
}
