import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const API_URL = 'http://localhost:5000/api/rubrics/assignment';
const JWT_SECRET = process.env.JWT_SECRET || 'peer_review_ai_secret_key_2026';

function generateToken(user) {
    return jwt.sign(
        { userId: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

async function fetchAPI(endpoint, method, token, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json().catch(() => null);
    return { status: response.status, data };
}

function assertStatus(actual, expected, testName) {
    if (actual !== expected) {
        throw new Error(`${testName} FAILED. Expected ${expected}, got ${actual}`);
    }
    console.log(`[PASS] ${testName} -> ${actual}`);
}

async function runTests() {
    console.log('--- BẮT ĐẦU TEST TASK 04.2 — RUBRIC ---');
    let adminId, teacherAId, teacherBId, studentId, classAId, groupId, assignmentId, courseId, roleIds = {};
    
    try {
        // --- 1. SETUP MOCK DATA ---
        console.log('1. Đang chuẩn bị dữ liệu (Users, Classes, Groups, Assignment)...');
        
        const roles = ['ADMIN', 'TEACHER', 'STUDENT'];
        for (const role of roles) {
            let r = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
            if (r.rows.length === 0) {
                r = await pool.query('INSERT INTO roles (name) VALUES ($1) RETURNING id', [role]);
            }
            roleIds[role] = r.rows[0].id;
        }

        const createUsr = async (roleName, email) => {
            const res = await pool.query(
                'INSERT INTO users (role_id, full_name, email) VALUES ($1, $2, $3) RETURNING id',
                [roleIds[roleName], email, email]
            );
            return { id: res.rows[0].id, role: roleName, email };
        };

        const admin = await createUsr('ADMIN', 'rubric_admin@test.com');
        const teacherA = await createUsr('TEACHER', 'rubric_teachera@test.com');
        const teacherB = await createUsr('TEACHER', 'rubric_teacherb@test.com');
        const student = await createUsr('STUDENT', 'rubric_student@test.com');
        
        adminId = admin.id; teacherAId = teacherA.id; teacherBId = teacherB.id; studentId = student.id;

        const courseRes = await pool.query("INSERT INTO courses (code, name) VALUES ('RUBRIC101', 'Rubric Test Course') RETURNING id");
        courseId = courseRes.rows[0].id;
        
        const classRes = await pool.query(
            "INSERT INTO classes (course_id, teacher_id, name) VALUES ($1, $2, 'Class A Test') RETURNING id",
            [courseId, teacherAId]
        );
        classAId = classRes.rows[0].id;

        const groupRes = await pool.query(
            "INSERT INTO groups (class_id, name) VALUES ($1, 'Group 1 Test') RETURNING id",
            [classAId]
        );
        groupId = groupRes.rows[0].id;

        await pool.query(
            "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
            [groupId, studentId]
        );

        const assignmentRes = await pool.query(
            "INSERT INTO assignments (class_id, title, deadline) VALUES ($1, 'Rubric Test Assignment', '2030-01-01T00:00:00Z') RETURNING id",
            [classAId]
        );
        assignmentId = assignmentRes.rows[0].id;

        const tokenAdmin = generateToken(admin);
        const tokenTeacherA = generateToken(teacherA);
        const tokenTeacherB = generateToken(teacherB);
        const tokenStudent = generateToken(student);
        
        console.log('[OK] Đã chuẩn bị dữ liệu xong.\n');

        // --- 2. TEST GET RUBRIC ---
        console.log('2. Test GET Rubric');
        
        let res = await fetchAPI(`/${assignmentId}`, 'GET', tokenTeacherA);
        assertStatus(res.status, 404, 'GET rubric chưa tạo (Teacher A)');
        
        const fakeUUID = '123e4567-e89b-12d3-a456-426614174000';
        res = await fetchAPI(`/${fakeUUID}`, 'GET', tokenTeacherA);
        assertStatus(res.status, 404, 'GET assignment không tồn tại (Teacher A)');
        
        res = await fetchAPI(`/${assignmentId}`, 'GET', tokenTeacherB);
        assertStatus(res.status, 403, 'GET bởi Teacher B (không sở hữu lớp)');
        
        res = await fetchAPI(`/${assignmentId}`, 'GET', tokenAdmin);
        // Admin luôn có quyền truy cập, nhưng chưa có rubric
        assertStatus(res.status, 404, 'GET rubric chưa tạo (Admin)');
        
        console.log('');

        // --- 3. TEST PUT VALIDATION ---
        console.log('3. Test PUT Validation (Weight & Auth)');
        
        res = await fetchAPI(`/${assignmentId}`, 'PUT', tokenStudent, { criteria: [{name: 'Test', weight: 100}] });
        assertStatus(res.status, 403, 'PUT bởi Student -> Forbidden');
        
        res = await fetchAPI(`/${assignmentId}`, 'PUT', tokenTeacherB, { criteria: [{name: 'Test', weight: 100}] });
        assertStatus(res.status, 403, 'PUT bởi Teacher B (khác lớp) -> Forbidden');
        
        res = await fetchAPI(`/${assignmentId}`, 'PUT', tokenTeacherA, { criteria: [] });
        assertStatus(res.status, 400, 'PUT criteria rỗng -> Bad Request');
        
        res = await fetchAPI(`/${assignmentId}`, 'PUT', tokenTeacherA, { criteria: [{name: 'A', weight: 50}, {name: 'B', weight: 49.9}] });
        assertStatus(res.status, 400, 'PUT tổng weight != 100 -> Bad Request');
        
        console.log('');

        // --- 4. TEST CREATE & UPDATE & ADMIN ---
        console.log('4. Test Create, Update & Admin Role');
        
        const validRubric1 = {
            description: "Rubric version 1",
            criteria: [
                { name: "Code Quality", weight: 50.5 },
                { name: "UI/UX", weight: 49.5 }
            ]
        };
        res = await fetchAPI(`/${assignmentId}`, 'PUT', tokenTeacherA, validRubric1);
        assertStatus(res.status, 200, 'PUT tạo Rubric mới (Teacher A)');
        
        res = await fetchAPI(`/${assignmentId}`, 'GET', tokenTeacherA);
        assertStatus(res.status, 200, 'GET Rubric đã tạo (Teacher A)');
        if (res.data?.criteria?.length !== 2) throw new Error("Criteria count should be 2");

        const validRubric2 = {
            description: "Rubric version 2",
            criteria: [
                { name: "Logic", weight: 100 }
            ]
        };
        res = await fetchAPI(`/${assignmentId}`, 'PUT', tokenTeacherA, validRubric2);
        assertStatus(res.status, 200, 'PUT cập nhật Rubric (Teacher A)');
        if (res.data?.criteria?.length !== 1) throw new Error("Criteria count should be 1 after update");

        // TEST ADMIN ROLE
        const validRubricAdmin = {
            description: "Rubric edited by Admin",
            criteria: [
                { name: "Admin review", weight: 100 }
            ]
        };
        res = await fetchAPI(`/${assignmentId}`, 'PUT', tokenAdmin, validRubricAdmin);
        assertStatus(res.status, 200, 'PUT cập nhật Rubric (Admin)');
        if (res.data?.description !== "Rubric edited by Admin") throw new Error("Description not updated by admin");

        // TEST GET by STUDENT
        res = await fetchAPI(`/${assignmentId}`, 'GET', tokenStudent);
        assertStatus(res.status, 200, 'GET Rubric (Student trong lớp)');
        
        console.log('\n[ALL TESTS PASSED SUCCESSFULLY!]\n');

    } catch (e) {
        console.error('LỖI TRONG QUÁ TRÌNH TEST:', e);
    } finally {
        console.log('--- DỌN DẸP DỮ LIỆU TÙY THUỘC (CASCADE) ---');
        try {
            // Delete in reverse order of dependency if not using CASCADE, 
            // but for simplicity we delete users and courses, which cascades down.
            // Just to be safe, we explicitly delete assignments first
            await pool.query('DELETE FROM assignments WHERE class_id = $1', [classAId]);
            await pool.query('DELETE FROM group_members WHERE group_id = $1', [groupId]);
            await pool.query('DELETE FROM groups WHERE class_id = $1', [classAId]);
            await pool.query('DELETE FROM classes WHERE course_id = $1', [courseId]);
            await pool.query("DELETE FROM courses WHERE code = 'RUBRIC101'");
            await pool.query('DELETE FROM users WHERE email LIKE $1', ['rubric_%@test.com']);
            console.log('[OK] Đã dọn dẹp xong.');
        } catch(e) {
            console.error('Lỗi khi dọn dẹp:', e);
        }
        await pool.end();
    }
}

runTests();
