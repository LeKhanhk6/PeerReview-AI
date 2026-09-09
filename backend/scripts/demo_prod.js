import 'dotenv/config';
import pool from '../src/config/db.js';

const API_URL = 'http://localhost:5000/api';

async function runDemo() {
    try {
        console.log('1. Fetching IDs directly from DB to simulate the flow...');
        
        // Find an assignment
        const aRes = await pool.query("SELECT id, deadline FROM assignments LIMIT 1");
        if (aRes.rowCount === 0) throw new Error('No assignments found');
        const assignmentId = aRes.rows[0].id;
        
        // Cập nhật deadline về ngày hôm qua để mở window
        console.log('--- Temporarily updating deadline to 12 hours ago to OPEN window ---');
        const past = new Date();
        past.setHours(past.getHours() - 12);
        await pool.query('UPDATE assignments SET deadline = $1 WHERE id = $2', [past, assignmentId]);

        // Find a group
        const gRes = await pool.query("SELECT id FROM groups LIMIT 1");
        if (gRes.rowCount === 0) throw new Error('No groups found');
        const groupId = gRes.rows[0].id;

        // Get members of this group
        const memRes = await pool.query("SELECT user_id FROM group_members WHERE group_id = $1", [groupId]);
        if (memRes.rowCount < 2) throw new Error('Need at least 2 members in the group to test');
        const s2Id = memRes.rows[0].user_id;
        const s3Id = memRes.rows[1].user_id;

        // Get their emails to login
        const u2Res = await pool.query("SELECT email FROM users WHERE id = $1", [s2Id]);
        const evaluatorEmail = u2Res.rows[0].email;
        const u3Res = await pool.query("SELECT full_name FROM users WHERE id = $1", [s3Id]);
        const evaluateeName = u3Res.rows[0].full_name;

        console.log(`Found IDs -> Assignment: ${assignmentId}, Group: ${groupId}, Evaluatee: ${s3Id}`);

        console.log(`2. Logging in as ${evaluatorEmail}...`);
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: evaluatorEmail, password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.data?.accessToken || loginData.accessToken;
        if (!token) throw new Error('No token received');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        console.log(`3. Submitting evaluation for peer: ${evaluateeName}...`);
        const postRes = await fetch(`${API_URL}/assignments/${assignmentId}/groups/${groupId}/internal-evaluations`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                evaluateeId: s3Id,
                c2_score: 5,
                c3_score: 4,
                c4_score: 5
            })
        });
        const postJson = await postRes.json();
        console.log('POST Result:', postJson);

        console.log('4. GET evaluations to verify prefill and anonymity...');
        const getRes = await fetch(`${API_URL}/assignments/${assignmentId}/groups/${groupId}/internal-evaluations`, { headers });
        const getJson = await getRes.json();
        console.log('GET Result (Prefill Data):', JSON.stringify(getJson, null, 2));

        console.log('--- Restoring assignment deadline ---');
        await pool.query('UPDATE assignments SET deadline = $1 WHERE id = $2', [aRes.rows[0].deadline, assignmentId]);

    } catch (error) {
        console.error('Demo error:', error.message || error);
    } finally {
        pool.end();
    }
}

runDemo();
