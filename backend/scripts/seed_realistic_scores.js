import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedRealistic() {
  const assignmentId = 'd0000000-4000-4000-8000-000000000001';

  // Define realistic student profiles per group
  // M = 5 members per group
  const groupProfiles = [
    {
      // Nhóm 1: Alpha Team (High performing team, varied strengths)
      groupId: 'e0000000-4000-4000-8000-000000000001',
      members: [
        { id: 'b0000000-4000-4000-8000-000000000101', name: 'Trần Thị Mai', tasksDone: 3, tasksTotal: 3, acts: 8, evalBase: { c2: 4.8, c3: 5.0, c4: 4.9 } },
        { id: 'b0000000-4000-4000-8000-000000000102', name: 'Lê Văn Hùng', tasksDone: 2, tasksTotal: 2, acts: 6, evalBase: { c2: 4.9, c3: 4.6, c4: 4.4 } },
        { id: 'b0000000-4000-4000-8000-000000000103', name: 'Phạm Minh Dũng', tasksDone: 2, tasksTotal: 2, acts: 5, evalBase: { c2: 4.5, c3: 4.8, c4: 4.5 } },
        { id: 'b0000000-4000-4000-8000-000000000104', name: 'Nguyễn Tuấn Anh', tasksDone: 1, tasksTotal: 1, acts: 4, evalBase: { c2: 4.2, c3: 4.3, c4: 4.8 } },
        { id: 'b0000000-4000-4000-8000-000000000105', name: 'Vũ Quốc Huy', tasksDone: 1, tasksTotal: 1, acts: 3, evalBase: { c2: 4.0, c3: 4.4, c4: 4.6 } },
      ]
    },
    {
      // Nhóm 2: Beta Innovators (varied active team)
      groupId: 'e0000000-4000-4000-8000-000000000002',
      members: [
        { id: 'b0000000-4000-4000-8000-000000000106', name: 'Đặng Bảo Hải', tasksDone: 2, tasksTotal: 2, acts: 5, evalBase: { c2: 4.2, c3: 3.5, c4: 4.5 } },
        { id: 'b0000000-4000-4000-8000-000000000107', name: 'Ngô Đức Minh', tasksDone: 2, tasksTotal: 2, acts: 4, evalBase: { c2: 4.0, c3: 3.8, c4: 4.0 } },
        { id: 'b0000000-4000-4000-8000-000000000108', name: 'Dương Thu Ngân', tasksDone: 2, tasksTotal: 2, acts: 6, evalBase: { c2: 4.5, c3: 4.0, c4: 4.2 } },
        { id: 'b0000000-4000-4000-8000-000000000109', name: 'Hoàng Văn Lười', tasksDone: 1, tasksTotal: 2, acts: 2, evalBase: { c2: 2.5, c3: 2.0, c4: 2.5 } },
        { id: 'b0000000-4000-4000-8000-000000000110', name: 'Đinh Hải L', tasksDone: 2, tasksTotal: 2, acts: 4, evalBase: { c2: 3.8, c3: 3.2, c4: 3.8 } },
      ]
    },
    {
      // Nhóm 3: Gamma Coders (Unbalanced - Leader gánh team)
      groupId: 'e0000000-4000-4000-8000-000000000003',
      members: [
        { id: 'b0000000-4000-4000-8000-000000000111', name: 'Ngô Đức M', tasksDone: 5, tasksTotal: 5, acts: 9, evalBase: { c2: 4.9, c3: 4.8, c4: 4.8 } },
        { id: 'b0000000-4000-4000-8000-000000000112', name: 'Dương Thu N', tasksDone: 1, tasksTotal: 1, acts: 3, evalBase: { c2: 4.0, c3: 3.8, c4: 4.2 } },
        { id: 'b0000000-4000-4000-8000-000000000113', name: 'Hồ Khánh O', tasksDone: 1, tasksTotal: 1, acts: 2, evalBase: { c2: 3.8, c3: 4.0, c4: 4.0 } },
        { id: 'b0000000-4000-4000-8000-000000000114', name: 'Phan Trọng P', tasksDone: 1, tasksTotal: 1, acts: 2, evalBase: { c2: 3.5, c3: 3.5, c4: 4.1 } },
        { id: 'b0000000-4000-4000-8000-000000000115', name: 'Trịnh Như Q', tasksDone: 1, tasksTotal: 1, acts: 1, evalBase: { c2: 3.2, c3: 3.5, c4: 4.0 } },
      ]
    },
    {
      // Nhóm 4: Delta Builders (Solid team, pending review)
      groupId: 'e0000000-4000-4000-8000-000000000004',
      members: [
        { id: 'b0000000-4000-4000-8000-000000000116', name: 'Mai Văn R', tasksDone: 3, tasksTotal: 3, acts: 7, evalBase: { c2: 4.6, c3: 4.8, c4: 4.7 } },
        { id: 'b0000000-4000-4000-8000-000000000117', name: 'Lý Thị S', tasksDone: 2, tasksTotal: 2, acts: 5, evalBase: { c2: 4.8, c3: 4.5, c4: 4.4 } },
        { id: 'b0000000-4000-4000-8000-000000000118', name: 'Tạ Quang T', tasksDone: 2, tasksTotal: 2, acts: 4, evalBase: { c2: 4.3, c3: 4.6, c4: 4.5 } },
        { id: 'b0000000-4000-4000-8000-000000000119', name: 'Cao Phương U', tasksDone: 1, tasksTotal: 1, acts: 3, evalBase: { c2: 4.4, c3: 4.0, c4: 4.6 } },
        { id: 'b0000000-4000-4000-8000-000000000120', name: 'Vương Khắc V', tasksDone: 1, tasksTotal: 1, acts: 2, evalBase: { c2: 4.0, c3: 4.2, c4: 4.4 } },
      ]
    },
    {
      // Nhóm 5: Epsilon Tech (Free rider Vũ Văn F)
      groupId: 'e0000000-4000-4000-8000-000000000005',
      members: [
        { id: 'b0000000-4000-4000-8000-000000000122', name: 'Trần Hoàng X', tasksDone: 3, tasksTotal: 3, acts: 10, evalBase: { c2: 4.8, c3: 4.9, c4: 4.8 } },
        { id: 'b0000000-4000-4000-8000-000000000123', name: 'Lê Thị Y', tasksDone: 2, tasksTotal: 2, acts: 5, evalBase: { c2: 4.5, c3: 4.4, c4: 4.5 } },
        { id: 'b0000000-4000-4000-8000-000000000124', name: 'Nguyễn Văn Z', tasksDone: 2, tasksTotal: 2, acts: 4, evalBase: { c2: 4.3, c3: 4.5, c4: 4.4 } },
        { id: 'b0000000-4000-4000-8000-000000000125', name: 'Phạm Công W', tasksDone: 1, tasksTotal: 1, acts: 3, evalBase: { c2: 4.2, c3: 4.2, c4: 4.6 } },
        { id: 'b0000000-4000-4000-8000-000000000121', name: 'Vũ Văn F', tasksDone: 0, tasksTotal: 2, acts: 1, evalBase: { c2: 1.8, c3: 1.5, c4: 1.8 } },
      ]
    },
    {
      // Nhóm 6: Zeta Solutions (Incomplete tasks / Near deadline)
      groupId: 'e0000000-4000-4000-8000-000000000006',
      members: [
        { id: 'b0000000-4000-4000-8000-000000000126', name: 'Hoàng Minh K1', tasksDone: 1, tasksTotal: 1, acts: 5, evalBase: { c2: 4.2, c3: 3.2, c4: 4.4 } },
        { id: 'b0000000-4000-4000-8000-000000000127', name: 'Vũ Đức K2', tasksDone: 0, tasksTotal: 1, acts: 3, evalBase: { c2: 4.0, c3: 2.8, c4: 4.0 } },
        { id: 'b0000000-4000-4000-8000-000000000128', name: 'Đỗ Thanh K3', tasksDone: 0, tasksTotal: 1, acts: 3, evalBase: { c2: 3.8, c3: 2.9, c4: 4.2 } },
        { id: 'b0000000-4000-4000-8000-000000000129', name: 'Ngô Tuấn K4', tasksDone: 0, tasksTotal: 1, acts: 2, evalBase: { c2: 3.6, c3: 3.0, c4: 4.0 } },
        { id: 'b0000000-4000-4000-8000-000000000130', name: 'Bùi Văn K5', tasksDone: 0, tasksTotal: 1, acts: 2, evalBase: { c2: 3.5, c3: 2.8, c4: 3.8 } },
      ]
    }
  ];

  try {
    await pool.query('BEGIN');

    // 1. Clear old tasks and activity logs for class CS201 to rebuild realistic ones
    await pool.query(`DELETE FROM tasks WHERE group_id IN (SELECT id FROM groups WHERE class_id = 'c0000000-4000-4000-8000-000000000001')`);
    await pool.query(`DELETE FROM activity_logs WHERE group_id IN (SELECT id FROM groups WHERE class_id = 'c0000000-4000-4000-8000-000000000001')`);
    await pool.query(`DELETE FROM internal_evaluations WHERE group_id IN (SELECT id FROM groups WHERE class_id = 'c0000000-4000-4000-8000-000000000001')`);

    // 2. Re-insert Tasks & Activity Logs per member profile
    for (const g of groupProfiles) {
      for (const m of g.members) {
        // Insert done tasks
        for (let t = 1; t <= m.tasksDone; t++) {
          await pool.query(`
            INSERT INTO tasks (group_id, assignee_id, title, status, completed_at)
            VALUES ('${g.groupId}', '${m.id}', 'Nhiệm vụ ${t} của ${m.name}', 'DONE', NOW() - INTERVAL '${t} days')
          `);
        }
        // Insert todo tasks
        for (let t = 1; t <= (m.tasksTotal - m.tasksDone); t++) {
          await pool.query(`
            INSERT INTO tasks (group_id, assignee_id, title, status)
            VALUES ('${g.groupId}', '${m.id}', 'Nhiệm vụ dở dang ${t} của ${m.name}', 'TODO')
          `);
        }
        // Insert activity logs
        for (let a = 1; a <= m.acts; a++) {
          await pool.query(`
            INSERT INTO activity_logs (group_id, user_id, action_type, content_summary, created_at)
            VALUES ('${g.groupId}', '${m.id}', 'DISCUSSION', 'Thảo luận ${a} bởi ${m.name}', NOW() - INTERVAL '${a} days')
          `);
        }
      }

      // 3. Generate peer internal_evaluations with realistic slight variations around evalBase
      for (const evaluator of g.members) {
        for (const evaluatee of g.members) {
          if (evaluator.id === evaluatee.id) continue;

          // Add slight variation (+/- 0.2) based on evaluator hash to make it look 100% natural
          const var2 = ((evaluator.id.charCodeAt(35) % 3) - 1) * 0.1;
          const var3 = ((evaluator.id.charCodeAt(34) % 3) - 1) * 0.1;
          const var4 = ((evaluator.id.charCodeAt(33) % 3) - 1) * 0.1;

          let c2 = Math.min(5.0, Math.max(1.0, parseFloat((evaluatee.evalBase.c2 + var2).toFixed(1))));
          let c3 = Math.min(5.0, Math.max(1.0, parseFloat((evaluatee.evalBase.c3 + var3).toFixed(1))));
          let c4 = Math.min(5.0, Math.max(1.0, parseFloat((evaluatee.evalBase.c4 + var4).toFixed(1))));

          await pool.query(`
            INSERT INTO internal_evaluations (group_id, assignment_id, evaluator_id, evaluatee_id, c2_score, c3_score, c4_score)
            VALUES ('${g.groupId}', '${assignmentId}', '${evaluator.id}', '${evaluatee.id}', ${c2}, ${c3}, ${c4})
            ON CONFLICT (assignment_id, evaluator_id, evaluatee_id) DO UPDATE
            SET c2_score = EXCLUDED.c2_score, c3_score = EXCLUDED.c3_score, c4_score = EXCLUDED.c4_score;
          `);
        }
      }
    }

    await pool.query('COMMIT');
    console.log("Successfully seeded realistic, varied scores and tasks!");

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error("Error seeding realistic scores:", err);
  } finally {
    await pool.end();
  }
}

seedRealistic();
