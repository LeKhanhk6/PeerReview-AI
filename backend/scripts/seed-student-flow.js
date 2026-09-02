import pool from '../src/config/db.js';
import bcrypt from 'bcrypt';

async function seedStudentFlow() {
    try {
        console.log('Seeding student testing flow data...');

        // 1. Get role ID for STUDENT
        const roleRes = await pool.query(`SELECT id FROM roles WHERE name = 'STUDENT'`);
        if (roleRes.rows.length === 0) throw new Error('Role STUDENT not found.');
        const studentRoleId = roleRes.rows[0].id;

        // 2. Create student 2 and 3
        const hash = await bcrypt.hash('password123', 10);
        
        await pool.query(`
            INSERT INTO users (role_id, full_name, email, student_id, password_hash)
            VALUES 
            ($1, 'Student 2', 'student2@test.com', 'STUDENT_2', $2),
            ($1, 'Student 3', 'student3@test.com', 'STUDENT_3', $2)
            ON CONFLICT (email) DO NOTHING
        `, [studentRoleId, hash]);

        const s2Res = await pool.query(`SELECT id FROM users WHERE email = 'student2@test.com'`);
        const s3Res = await pool.query(`SELECT id FROM users WHERE email = 'student3@test.com'`);
        const s2Id = s2Res.rows[0].id;
        const s3Id = s3Res.rows[0].id;

        // 3. Get existing class and group 1
        const classRes = await pool.query(`SELECT id FROM classes WHERE course_code = 'CS101' LIMIT 1`);
        if (classRes.rows.length === 0) throw new Error('Class CS101 not found. Did you run seed-business.js?');
        const classId = classRes.rows[0].id;

        const group1Res = await pool.query(`SELECT id FROM groups WHERE name = 'Nhóm 1' AND class_id = $1`, [classId]);
        if (group1Res.rows.length === 0) throw new Error('Nhóm 1 not found.');
        const group1Id = group1Res.rows[0].id;

        // 4. Create Group 2 and add members
        const group2Res = await pool.query(`
            INSERT INTO groups (class_id, name)
            VALUES ($1, 'Nhóm 2')
            RETURNING id
        `, [classId]);
        const group2Id = group2Res.rows[0].id;

        await pool.query(`
            INSERT INTO class_members (class_id, user_id, role)
            VALUES 
            ($1, $2, 'STUDENT'),
            ($1, $3, 'STUDENT')
            ON CONFLICT DO NOTHING
        `, [classId, s2Id, s3Id]);

        await pool.query(`
            INSERT INTO group_members (group_id, user_id, is_leader)
            VALUES 
            ($1, $2, TRUE),
            ($1, $3, FALSE)
            ON CONFLICT DO NOTHING
        `, [group2Id, s2Id, s3Id]);

        // 5. Get assignment
        const assignRes = await pool.query(`SELECT id FROM assignments WHERE class_id = $1 LIMIT 1`, [classId]);
        if (assignRes.rows.length === 0) throw new Error('Assignment not found.');
        const assignmentId = assignRes.rows[0].id;

        // 6. Create Submission for Group 2
        const subRes = await pool.query(`
            INSERT INTO submissions (assignment_id, group_id, status)
            VALUES ($1, $2, 'SUBMITTED')
            RETURNING id
        `, [assignmentId, group2Id]);
        const submissionId = subRes.rows[0].id;

        await pool.query(`
            INSERT INTO submission_versions (submission_id, version_number, file_url)
            VALUES ($1, 1, 'https://example.com/dummy-submission.pdf')
        `, [submissionId]);

        // 7. Assign Group 1 to review Group 2's submission
        await pool.query(`
            INSERT INTO review_assignments (submission_id, reviewer_group_id, status)
            VALUES ($1, $2, 'PENDING')
            ON CONFLICT DO NOTHING
        `, [submissionId, group1Id]);

        console.log('Student testing flow data seeded successfully!');
        console.log('- Created Student 2 (student2@test.com) & Student 3 (student3@test.com)');
        console.log('- Created Nhóm 2 and assigned to Class L01');
        console.log('- Created a Submission from Nhóm 2');
        console.log('- Assigned Nhóm 1 to review Nhóm 2 (Peer Review Flow Ready)');

    } catch (e) {
        console.error('Error seeding student flow:', e);
    } finally {
        await pool.end();
    }
}

seedStudentFlow();
