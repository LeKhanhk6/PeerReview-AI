async function runTests() {
    console.log("--- BẮT ĐẦU TEST AUTH ---");
    const baseUrl = 'http://localhost:5000/api/auth';
    let token = '';

    try {
        // 1. Thiếu email/password
        let res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com' })
        });
        console.log("1. Thiếu email/password:", res.status, await res.json());

        // 2. Email không tồn tại
        res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'wrong@test.com', password: 'password123' })
        });
        console.log("2. Email không tồn tại:", res.status, await res.json());

        // 3. Sai password
        res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' })
        });
        console.log("3. Sai password:", res.status, await res.json());

        // 4. Login đúng
        res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'password123' })
        });
        const data = await res.json();
        console.log("4. Login đúng:", res.status, data.message, "Role:", data.user?.role);
        token = data.token;

        // 5. /me không có token
        res = await fetch(`${baseUrl}/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log("5. /me không có token:", res.status, await res.json());

        // 6. /me token không hợp lệ
        res = await fetch(`${baseUrl}/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer invalidtoken123' }
        });
        console.log("6. /me token không hợp lệ:", res.status, await res.json());

        // 7. /me token hợp lệ
        res = await fetch(`${baseUrl}/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        console.log("7. /me token hợp lệ:", res.status, (await res.json()).user?.email);
    } catch(e) {
        console.error("Test failed", e);
    }

    console.log("--- KẾT THÚC TEST ---");
    process.exit(0);
}

runTests();
