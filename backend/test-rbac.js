async function runTests() {
    console.log("--- BẮT ĐẦU TEST RBAC ---");
    const baseUrl = 'http://localhost:5000/api/auth';

    const assertStatus = (actual, expected, testName) => {
        if (actual !== expected) {
            throw new Error(`${testName} failed: expected ${expected}, got ${actual}`);
        }
        console.log(`✓ ${testName} passed`);
    };

    const loginUser = async (email, password = 'password123') => {
        const res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok || !data.token) {
            throw new Error(`Login failed for ${email}`);
        }
        return data.token;
    };

    try {
        const studentToken = await loginUser('test@student.com');
        const adminToken = await loginUser('test@admin.com');
        const teacherToken = await loginUser('test@teacher.com');

        console.log("✓ Logged in all test users successfully");

        // 1. No Token -> 401
        let res = await fetch(`${baseUrl}/admin-only`);
        assertStatus(res.status, 401, 'No token -> 401');

        // 2. Invalid Token -> 401
        res = await fetch(`${baseUrl}/admin-only`, {
            headers: { 'Authorization': 'Bearer invalid' }
        });
        assertStatus(res.status, 401, 'Invalid token -> 401');

        // 3. STUDENT -> ADMIN endpoint -> 403
        res = await fetch(`${baseUrl}/admin-only`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        assertStatus(res.status, 403, 'STUDENT -> ADMIN endpoint -> 403');

        // 3.5. TEACHER -> ADMIN endpoint -> 403
        res = await fetch(`${baseUrl}/admin-only`, {
            headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        assertStatus(res.status, 403, 'TEACHER -> ADMIN endpoint -> 403');

        // 4. ADMIN -> ADMIN endpoint -> 200
        res = await fetch(`${baseUrl}/admin-only`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assertStatus(res.status, 200, 'ADMIN -> ADMIN endpoint -> 200');

        // 5. STUDENT -> Multiple-role endpoint (ADMIN, TEACHER) -> 403
        res = await fetch(`${baseUrl}/staff-only`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        assertStatus(res.status, 403, 'STUDENT -> Multiple-role endpoint -> 403');

        // 6. ADMIN -> Multiple-role endpoint -> 200
        res = await fetch(`${baseUrl}/staff-only`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assertStatus(res.status, 200, 'ADMIN -> Multiple-role endpoint -> 200');

        // 7. TEACHER -> Multiple-role endpoint -> 200
        res = await fetch(`${baseUrl}/staff-only`, {
            headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        assertStatus(res.status, 200, 'TEACHER -> Multiple-role endpoint -> 200');

        console.log("--- KẾT THÚC TEST RBAC ---");
    } catch(e) {
        console.error("❌ Test failed:", e.message);
        process.exitCode = 1;
    }
}

runTests();
