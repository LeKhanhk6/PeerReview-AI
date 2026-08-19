import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function runTests() {
    console.log("--- BẮT ĐẦU TEST AUTH ---");
    const baseUrl = 'http://localhost:5000/api/auth';
    let token = '';

    const assertStatus = (actual, expected, testName) => {
        if (actual !== expected) {
            throw new Error(`${testName} failed: expected ${expected}, got ${actual}`);
        }
        console.log(`✓ ${testName} passed`);
    };

    try {
        // 1. Thiếu email/password
        let res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com' })
        });
        assertStatus(res.status, 400, 'Missing email/password');

        // 2. Email không tồn tại
        res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'wrong@test.com', password: 'password123' })
        });
        assertStatus(res.status, 401, 'Email not found');

        // 3. Sai password
        res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' })
        });
        assertStatus(res.status, 401, 'Wrong password');

        // 4. Login đúng (có test normalize email)
        res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: '  Test@Test.COM ', password: 'password123' })
        });
        const data = await res.json();
        assertStatus(res.status, 200, 'Valid login');
        
        if (!res.ok || !data.token) {
            throw new Error('Valid login failed, cannot continue authenticated tests.');
        }
        token = data.token;
        console.log(`  -> Role: ${data.user?.role}`);

        // 5. /me không có token
        res = await fetch(`${baseUrl}/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        assertStatus(res.status, 401, '/me without token');

        // 6. /me token không hợp lệ (format sai)
        res = await fetch(`${baseUrl}/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' }
        });
        assertStatus(res.status, 401, '/me with empty token string');

        // 7. /me token không hợp lệ (fake token)
        res = await fetch(`${baseUrl}/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer invalidtoken123' }
        });
        assertStatus(res.status, 401, '/me with invalid token');

        // 8. /me token hợp lệ
        res = await fetch(`${baseUrl}/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        assertStatus(res.status, 200, '/me with valid token');
        
        // 9. Expired token test
        // Generate an expired token using the secret from .env
        const JWT_SECRET = process.env.JWT_SECRET;
        const expiredToken = jwt.sign({ userId: '123', role: 'STUDENT' }, JWT_SECRET, { expiresIn: '-1h' });
        
        res = await fetch(`${baseUrl}/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${expiredToken}` }
        });
        assertStatus(res.status, 401, '/me with expired token');

        // 10. /logout token hợp lệ
        res = await fetch(`${baseUrl}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        assertStatus(res.status, 200, '/logout with valid token');

    } catch(e) {
        console.error("❌ Test failed:", e.message);
        process.exit(1);
    }

    console.log("--- KẾT THÚC TEST ---");
    process.exit(0);
}

runTests();
