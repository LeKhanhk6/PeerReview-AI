import 'dotenv/config';
import pool from '../src/config/db.js';
import { getCollaborationRisks } from '../src/services/analytics.service.js';

async function seed() {
  try {
    console.log('Seeding clean early warning data for Group 2 & Group 3...');

    // 1. Get Class SE301 & Assignment ID
    const classRes = await pool.query("SELECT id FROM classes WHERE name LIKE '%SE301%' OR course_code = 'SE301' ORDER BY created_at DESC LIMIT 1");
    if (classRes.rowCount === 0) throw new Error('Class SE301 not found');
    const classId = classRes.rows[0].id;

    const assignRes = await pool.query('SELECT id FROM assignments WHERE class_id = $1 LIMIT 1', [classId]);
    if (assignRes.rowCount === 0) throw new Error('Assignment not found');
    const assignmentId = assignRes.rows[0].id;

    // 2. Get Groups
    const groupsRes = await pool.query('SELECT id, name FROM groups WHERE class_id = $1 ORDER BY name', [classId]);
    const groups = groupsRes.rows;
    console.log('Groups found:', groups);

    const g1 = groups.find(g => g.name.includes('1'));
    const g2 = groups.find(g => g.name.includes('2'));
    const g3 = groups.find(g => g.name.includes('3'));

    // Users
    const u1 = 'b0000000-0000-4000-8000-000000000101'; // tranmai.sv01 (Nhóm 1)
    const u2 = 'b0000000-0000-4000-8000-000000000102'; // levanc.sv02 (Nhóm 1)
    const u9 = 'b0000000-4000-8000-0000-000000000109'; // vanf.sv09 (Nhóm 1 - Hoàng Văn Lười)

    const u3 = 'b0000000-0000-4000-8000-000000000103'; // phamminhd.sv03 (Nhóm 2 - Phạm Minh Dũng)
    const u4 = 'b0000000-4000-8000-0000-000000000104'; // tuananh.sv04 (Nhóm 2)
    const u5 = 'b0000000-4000-8000-0000-000000000105'; // vuquoch.sv05 (Nhóm 2)

    const u6 = 'b0000000-4000-8000-0000-000000000106'; // baohai.sv06 (Nhóm 3)
    const u7 = 'b0000000-4000-8000-0000-000000000107'; // ducminh.sv07 (Nhóm 3)
    const u8 = 'b0000000-4000-8000-0000-000000000108'; // thungan.sv08 (Nhóm 3 - Free-rider)

    // Re-arrange group members strictly as specified by user:
    // Nhóm 1: u1 (sv01), u2 (sv02), u9 (sv09)
    // Nhóm 2: u3 (sv03), u4 (sv04), u5 (sv05)
    // Nhóm 3: u6 (sv06), u7 (sv07), u8 (sv08)
    if (g1) {
      await pool.query('DELETE FROM group_members WHERE group_id = $1', [g1.id]);
      await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2), ($1, $3), ($1, $4)', [g1.id, u1, u2, u9]);
    }
    if (g2) {
      await pool.query('DELETE FROM group_members WHERE group_id = $1', [g2.id]);
      await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2), ($1, $3), ($1, $4)', [g2.id, u3, u4, u5]);
    }
    if (g3) {
      await pool.query('DELETE FROM group_members WHERE group_id = $1', [g3.id]);
      await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2), ($1, $3), ($1, $4)', [g3.id, u6, u7, u8]);
    }

    // --- SEED GROUP 1 (NO WARNINGS - HEALTHY TEAM) ---
    // Clear & seed internal evals for Group 1 with good ratings
    await pool.query('DELETE FROM internal_evaluations WHERE assignment_id = $1 AND group_id = $2', [assignmentId, g1.id]);
    const evalsG1 = [
      [g1.id, assignmentId, u1, u2, 5, 5, 5],
      [g1.id, assignmentId, u1, u9, 4, 4, 4],
      [g1.id, assignmentId, u2, u1, 5, 5, 5],
      [g1.id, assignmentId, u2, u9, 4, 4, 4],
      [g1.id, assignmentId, u9, u1, 5, 5, 5],
      [g1.id, assignmentId, u9, u2, 4, 4, 4],
    ];
    for (const e of evalsG1) {
      await pool.query(`
        INSERT INTO internal_evaluations (group_id, assignment_id, evaluator_id, evaluatee_id, c2_score, c3_score, c4_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (assignment_id, evaluator_id, evaluatee_id) DO UPDATE
        SET c2_score = EXCLUDED.c2_score, c3_score = EXCLUDED.c3_score, c4_score = EXCLUDED.c4_score
      `, e);
    }

    // Tasks for Group 1 (balanced across u1, u2, u9)
    await pool.query('DELETE FROM tasks WHERE group_id = $1', [g1.id]);
    await pool.query(`
      INSERT INTO tasks (group_id, title, status, assignee_id) VALUES
      ($1, 'Thiết kế CSDL PostgreSQL', 'DONE', $2),
      ($1, 'Viết API Auth JWT', 'DONE', $3),
      ($1, 'Xây dựng UI Dashboard', 'DONE', $4)
    `, [g1.id, u1, u2, u9]);

    // Activity logs for Group 1 (balanced)
    await pool.query('DELETE FROM activity_logs WHERE group_id = $1', [g1.id]);
    for (let i = 0; i < 5; i++) {
      await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g1.id, u1, 'TASK_CREATE', 'Tạo task']);
      await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g1.id, u2, 'TASK_UPDATE', 'Cập nhật task']);
      await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g1.id, u9, 'DISCUSSION_POST', 'Thảo luận']);
    }

    // --- SEED GROUP 2 (1 WARNING: UNBALANCED_CONTRIBUTION) ---
    await pool.query('DELETE FROM internal_evaluations WHERE assignment_id = $1 AND group_id = $2', [assignmentId, g2.id]);
    const evalsG2 = [
      [g2.id, assignmentId, u3, u4, 4, 4, 4],
      [g2.id, assignmentId, u3, u5, 4, 4, 4],
      [g2.id, assignmentId, u4, u3, 5, 5, 5],
      [g2.id, assignmentId, u4, u5, 4, 4, 4],
      [g2.id, assignmentId, u5, u3, 5, 5, 5],
      [g2.id, assignmentId, u5, u4, 4, 4, 4],
    ];
    for (const e of evalsG2) {
      await pool.query(`
        INSERT INTO internal_evaluations (group_id, assignment_id, evaluator_id, evaluatee_id, c2_score, c3_score, c4_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (assignment_id, evaluator_id, evaluatee_id) DO UPDATE
        SET c2_score = EXCLUDED.c2_score, c3_score = EXCLUDED.c3_score, c4_score = EXCLUDED.c4_score
      `, e);
    }

    // Tasks for Group 2 (Total 6 tasks: u3 does 4 tasks, u4 does 1 task, u5 does 1 task)
    await pool.query('DELETE FROM tasks WHERE group_id = $1', [g2.id]);
    for (let i = 1; i <= 4; i++) {
      await pool.query('INSERT INTO tasks (group_id, title, status, assignee_id) VALUES ($1, $2, $3, $4)', [g2.id, `Nhiệm vụ chính ${i}`, 'DONE', u3]);
    }
    await pool.query('INSERT INTO tasks (group_id, title, status, assignee_id) VALUES ($1, $2, $3, $4)', [g2.id, 'Kiểm thử Module A', 'DONE', u4]);
    await pool.query('INSERT INTO tasks (group_id, title, status, assignee_id) VALUES ($1, $2, $3, $4)', [g2.id, 'Kiểm thử Module B', 'DONE', u5]);

    // Activity logs for Group 2: u3 creates 4 tasks and updates 10 times (15 total); u4 and u5 have 5 activities each
    await pool.query('DELETE FROM activity_logs WHERE group_id = $1', [g2.id]);
    for (let i = 0; i < 4; i++) {
      await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g2.id, u3, 'TASK_CREATE', 'Tạo task mới']);
    }
    for (let i = 0; i < 11; i++) {
      await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g2.id, u3, 'TASK_UPDATE', 'Gánh công việc']);
    }
    for (let i = 0; i < 5; i++) {
      await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g2.id, u4, 'DISCUSSION_POST', 'Hỗ trợ']);
      await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g2.id, u5, 'DISCUSSION_POST', 'Hỗ trợ']);
    }

    // --- SEED GROUP 3 (1 WARNING: FREE-RIDER / LOW_CONTRIBUTION FOR u8 DƯƠNG THU NGÂN) ---
    await pool.query('DELETE FROM internal_evaluations WHERE assignment_id = $1 AND group_id = $2', [assignmentId, g3.id]);
    const evalsG3 = [
      // u6 and u7 evaluate each other high, but evaluate u8 LOW (1 star)
      [g3.id, assignmentId, u6, u7, 5, 5, 5],
      [g3.id, assignmentId, u6, u8, 1, 1, 1],
      [g3.id, assignmentId, u7, u6, 5, 5, 5],
      [g3.id, assignmentId, u7, u8, 1, 1, 1],
      [g3.id, assignmentId, u8, u6, 4, 4, 4],
      [g3.id, assignmentId, u8, u7, 4, 4, 4],
    ];
    for (const e of evalsG3) {
      await pool.query(`
        INSERT INTO internal_evaluations (group_id, assignment_id, evaluator_id, evaluatee_id, c2_score, c3_score, c4_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (assignment_id, evaluator_id, evaluatee_id) DO UPDATE
        SET c2_score = EXCLUDED.c2_score, c3_score = EXCLUDED.c3_score, c4_score = EXCLUDED.c4_score
      `, e);
    }

    // Tasks for Group 3 (u6 and u7 complete tasks, u8 has 0 tasks)
    await pool.query('DELETE FROM tasks WHERE group_id = $1', [g3.id]);
    await pool.query(`
      INSERT INTO tasks (group_id, title, status, assignee_id) VALUES
      ($1, 'Thiết kế hệ thống', 'DONE', $2),
      ($1, 'Lập trình Backend', 'DONE', $3)
    `, [g3.id, u6, u7]);

    // Activity logs for Group 3 (u6 and u7 active, u8 has 1 minor activity to avoid LOW_ACTIVITY double warning)
    await pool.query('DELETE FROM activity_logs WHERE group_id = $1', [g3.id]);
    for (let i = 0; i < 6; i++) {
      await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g3.id, u6, 'TASK_CREATE', 'Tạo task']);
      await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g3.id, u7, 'TASK_UPDATE', 'Cập nhật task']);
    }
    await pool.query('INSERT INTO activity_logs (group_id, user_id, action_type, content_summary) VALUES ($1, $2, $3, $4)', [g3.id, u8, 'DISCUSSION_POST', 'Chào cả nhà']);

    console.log('Seed completed successfully!');

    // Test Early Warning API output
    const teacherId = (await pool.query("SELECT teacher_id FROM classes WHERE id = $1", [classId])).rows[0].teacher_id;
    const teacherUser = { userId: teacherId, role: 'TEACHER' };
    const risks = await getCollaborationRisks(teacherUser, classId);
    console.log('GENERATED EARLY WARNING RISKS:', JSON.stringify(risks, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Seed error:', e);
    process.exit(1);
  }
}

seed();
