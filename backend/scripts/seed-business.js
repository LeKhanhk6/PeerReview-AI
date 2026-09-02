import pool from '../src/config/db.js';

async function seedBusiness() {
    try {
        console.log('Seeding business logic data...');

        // 1. Get users
        const teacherRes = await pool.query(`SELECT id FROM users WHERE email = 'test@teacher.com'`);
        const studentRes = await pool.query(`SELECT id FROM users WHERE email = 'test@student.com'`);
        
        if (teacherRes.rows.length === 0 || studentRes.rows.length === 0) {
            throw new Error('Please run seed-user.js first to create users.');
        }

        const teacherId = teacherRes.rows[0].id;
        const studentId = studentRes.rows[0].id;

        // 2. Create Course (if not exists)
        // Wait, there's no courses table in Database.md. Wait! 
        // In database.md, the 'classes' table has course_code, course_name. There is NO 'courses' table.
        // Let's create a Class directly.
        const classRes = await pool.query(`
            INSERT INTO classes (teacher_id, course_code, course_name, name, invite_code, semester)
            VALUES ($1, 'CS101', 'Nhập môn Công nghệ Phần mềm', 'Lớp L01', 'INVITE123', 'HK241')
            RETURNING id
        `, [teacherId]);
        const classId = classRes.rows[0].id;

        // 3. Add student to class
        await pool.query(`
            INSERT INTO class_members (class_id, user_id, role)
            VALUES ($1, $2, 'STUDENT')
            ON CONFLICT DO NOTHING
        `, [classId, studentId]);

        // 4. Create Group
        const groupRes = await pool.query(`
            INSERT INTO groups (class_id, name)
            VALUES ($1, 'Nhóm 1')
            RETURNING id
        `, [classId]);
        const groupId = groupRes.rows[0].id;

        // Add student to group
        await pool.query(`
            INSERT INTO group_members (group_id, user_id, is_leader)
            VALUES ($1, $2, TRUE)
            ON CONFLICT DO NOTHING
        `, [groupId, studentId]);

        // 5. Create Assignment
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7); // 7 days from now
        
        const assignmentRes = await pool.query(`
            INSERT INTO assignments (class_id, title, description, requirements, deadline)
            VALUES ($1, 'Báo cáo giữa kỳ', 'Viết tài liệu thiết kế hệ thống', 'File PDF, tối đa 20 trang', $2)
            RETURNING id
        `, [classId, deadline.toISOString()]);
        const assignmentId = assignmentRes.rows[0].id;

        // 6. Create Rubric
        const rubricRes = await pool.query(`
            INSERT INTO rubrics (assignment_id, description)
            VALUES ($1, 'Rubric đánh giá báo cáo giữa kỳ')
            RETURNING id
        `, [assignmentId]);
        const rubricId = rubricRes.rows[0].id;

        // 7. Add Criteria
        await pool.query(`
            INSERT INTO rubric_criteria (rubric_id, name, description, weight)
            VALUES 
            ($1, 'Hình thức', 'Trình bày đúng format, không lỗi chính tả', 20),
            ($1, 'Nội dung', 'Thiết kế hệ thống hợp lý, đầy đủ chức năng', 50),
            ($1, 'Mức độ sáng tạo', 'Có tính năng đột phá', 30)
        `, [rubricId]);

        console.log('Business logic data seeded successfully!');
        console.log('Class ID:', classId);
        console.log('Assignment ID:', assignmentId);
        
    } catch (e) {
        console.error('Error seeding business logic:', e);
    } finally {
        await pool.end();
    }
}

seedBusiness();
