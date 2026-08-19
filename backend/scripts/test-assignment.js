import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const API_URL = 'http://localhost:5000/api/assignments';
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

async function runTests() {
    console.log('--- BẮT ĐẦU TEST TASK 04.1 — ASSIGNMENT ---');
    let adminId, teacherAId, teacherBId, studentId, classAId, groupId, roleIds = {};
    
    try {
        // --- 1. SETUP MOCK DATA ---
        console.log('1. Đang chuẩn bị dữ liệu (Users, Classes, Groups)...');
        
        // Lấy hoặc tạo roles
        const roles = ['ADMIN', 'TEACHER', 'STUDENT'];
        for (const role of roles) {
            let r = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
            if (r.rows.length === 0) {
                r = await pool.query('INSERT INTO roles (name) VALUES ($1) RETURNING id', [role]);
            }
            roleIds[role] = r.rows[0].id;
        }

        // Tạo Users
        const createUsr = async (roleName, email) => {
            const res = await pool.query(
                'INSERT INTO users (role_id, full_name, email) VALUES ($1, $2, $3) RETURNING id',
                [roleIds[roleName], email, email]
            );
            return { id: res.rows[0].id, role: roleName, email };
        };

        const admin = await createUsr('ADMIN', 'admin_test@test.com');
        const teacherA = await createUsr('TEACHER', 'teachera_test@test.com');
        const teacherB = await createUsr('TEACHER', 'teacherb_test@test.com');
        const student = await createUsr('STUDENT', 'student_test@test.com');
        
        adminId = admin.id; teacherAId = teacherA.id; teacherBId = teacherB.id; studentId = student.id;

        // Tạo Course & Class cho Teacher A
        const courseRes = await pool.query("INSERT INTO courses (code, name) VALUES ('TEST101', 'Test Course') RETURNING id");
        const courseId = courseRes.rows[0].id;
        
        const classRes = await pool.query(
            "INSERT INTO classes (course_id, teacher_id, name) VALUES ($1, $2, 'Class A Test') RETURNING id",
            [courseId, teacherAId]
        );
        classAId = classRes.rows[0].id;

        // Tạo Group & Add Student vào Group của Class A
        const groupRes = await pool.query(
            "INSERT INTO groups (class_id, name) VALUES ($1, 'Group 1 Test') RETURNING id",
            [classAId]
        );
        groupId = groupRes.rows[0].id;

        await pool.query(
            "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
            [groupId, studentId]
        );

        // Generate Tokens
        const tokenAdmin = generateToken(admin);
        const tokenTeacherA = generateToken(teacherA);
        const tokenTeacherB = generateToken(teacherB);
        const tokenStudent = generateToken(student);
        
        console.log('[OK] Đã chuẩn bị Token xong.\n');

        // --- 2. TEST VALIDATION ---
        console.log('2. Test Validation (Dùng Token Teacher A)');
        
        let res = await fetchAPI('', 'POST', tokenTeacherA, { class_id: 'invalid-uuid', title: 'T', deadline: new Date().toISOString() });
        console.log(`- POST với class_id linh tinh -> Expected: 400, Actual: ${res.status}`);
        
        res = await fetchAPI('', 'POST', tokenTeacherA, { class_id: classAId, title: '   ', deadline: new Date().toISOString() });
        console.log(`- POST với title rỗng -> Expected: 400, Actual: ${res.status}`);
        
        res = await fetchAPI('', 'POST', tokenTeacherA, { class_id: classAId, title: 'Valid Title', deadline: '2020-01-01T00:00:00Z' });
        console.log(`- POST với deadline quá khứ -> Expected: 400, Actual: ${res.status}`);
        console.log('');

        // --- 3. TEST RESOURCE EXISTENCE & OWNERSHIP ---
        console.log('3. Test Resource Existence & Ownership (404 & 403)');
        
        const fakeUUID = '123e4567-e89b-12d3-a456-426614174000';
        res = await fetchAPI('', 'POST', tokenTeacherA, { class_id: fakeUUID, title: 'Test 404', deadline: '2030-01-01T00:00:00Z' });
        console.log(`- POST class_id không tồn tại -> Expected: 404, Actual: ${res.status}`);
        
        res = await fetchAPI('', 'POST', tokenTeacherB, { class_id: classAId, title: 'Test 403', deadline: '2030-01-01T00:00:00Z' });
        console.log(`- POST (Teacher B) vào class Teacher A -> Expected: 403, Actual: ${res.status}`);
        
        res = await fetchAPI('', 'POST', tokenTeacherA, { class_id: classAId, title: 'Assignment 1', description: 'Desc', deadline: '2030-01-01T00:00:00Z' });
        console.log(`- POST tạo thành công (Teacher A) -> Expected: 201, Actual: ${res.status}`);
        
        let createdAssignmentId = null;
        if (res.status === 201) {
            createdAssignmentId = res.data.id;
        } else {
            console.log('  LỖI: Không lấy được Assignment ID, chi tiết: ', res.data);
        }

        if (createdAssignmentId) {
            res = await fetchAPI(`/${createdAssignmentId}`, 'PUT', tokenTeacherB, { title: 'Hacked', deadline: '2030-01-01T00:00:00Z' });
            console.log(`- PUT (Teacher B) sửa bài tập Teacher A -> Expected: 403, Actual: ${res.status}`);
        }
        console.log('');

        // --- 4. TEST ROLE-BASED DATA FILTERING ---
        console.log('4. Test Role-based Data Filtering (GET)');
        
        res = await fetchAPI('', 'GET', tokenAdmin);
        console.log(`- GET (ADMIN) -> Expected: 200 (Thấy toàn bộ, >=1), Actual: ${res.status}, Length: ${res.data?.length}`);
        
        res = await fetchAPI('', 'GET', tokenTeacherA);
        console.log(`- GET (Teacher A) -> Expected: 200 (Thấy của mình), Actual: ${res.status}, Length: ${res.data?.length}`);
        
        res = await fetchAPI('', 'GET', tokenStudent);
        console.log(`- GET (Student) -> Expected: 200 (Thấy bài tập nhóm), Actual: ${res.status}, Length: ${res.data?.length}`);

    } catch (e) {
        console.error('LỖI TRONG QUÁ TRÌNH TEST:', e);
    } finally {
        console.log('\n--- DỌN DẸP DỮ LIỆU ---');
        try {
            await pool.query('DELETE FROM users WHERE email LIKE $1', ['%_test@test.com']);
            await pool.query("DELETE FROM courses WHERE code = 'TEST101'");
            console.log('[OK] Đã dọn dẹp xong.');
        } catch(e) {
            console.error('Lỗi khi dọn dẹp:', e);
        }
        await pool.end();
    }
}

runTests();
