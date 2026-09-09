import 'dotenv/config';
import pool from '../src/config/db.js';

const API_URL = 'http://localhost:5000/api';

async function runDemo() {
    try {
        console.log('1. Preparing data for Task 5 Demo...');
        const aRes = await pool.query("SELECT id, deadline, class_id FROM assignments LIMIT 1");
        const assignmentId = aRes.rows[0].id;
        const classId = aRes.rows[0].class_id;

        const gRes = await pool.query("SELECT id FROM groups LIMIT 1");
        const groupId = gRes.rows[0].id;

        const memRes = await pool.query("SELECT user_id FROM group_members WHERE group_id = $1", [groupId]);
        const s2Id = memRes.rows[0].user_id;
        const s3Id = memRes.rows[1].user_id;

        const u2Res = await pool.query("SELECT email FROM users WHERE id = $1", [s2Id]);
        const evaluatorEmail = u2Res.rows[0].email;
        
        const u3Res = await pool.query("SELECT email FROM users WHERE id = $1", [s3Id]);
        const evaluateeEmail = u3Res.rows[0].email;

        const tRes = await pool.query("SELECT teacher_id FROM classes WHERE id = $1", [classId]);
        const teacherId = tRes.rows[0].teacher_id;
        const uTRes = await pool.query("SELECT email FROM users WHERE id = $1", [teacherId]);
        const teacherEmail = uTRes.rows[0].email;

        // Open window
        const past = new Date();
        past.setHours(past.getHours() - 12);
        await pool.query('UPDATE assignments SET deadline = $1 WHERE id = $2', [past, assignmentId]);

        console.log(`2. S2 (${evaluatorEmail}) logs in and evaluates S3...`);
        let res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: evaluatorEmail, password: 'password123' })
        });
        let s2Token = (await res.json()).data.accessToken;

        await fetch(`${API_URL}/assignments/${assignmentId}/groups/${groupId}/internal-evaluations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s2Token}` },
            body: JSON.stringify({ evaluateeId: s3Id, c2_score: 5, c3_score: 5, c4_score: 5 })
        });

        console.log('3. Closing window (deadline > 24 hours ago)...');
        const closedDate = new Date();
        closedDate.setDate(closedDate.getDate() - 3);
        await pool.query('UPDATE assignments SET deadline = $1 WHERE id = $2', [closedDate, assignmentId]);

        console.log(`4. Teacher (${teacherEmail}) logs in and calls PUBLISH...`);
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: teacherEmail, password: 'password123' })
        });
        let tToken = (await res.json()).data.accessToken;

        const pubRes = await fetch(`${API_URL}/analytics/assignments/${assignmentId}/groups/${groupId}/analytics/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tToken}` },
        });
        console.log('Publish result status:', pubRes.status);
        if (!pubRes.ok) console.log(await pubRes.json());

        console.log('5. Modifying DB (Changing S3 evaluation score directly)...');
        await pool.query('UPDATE internal_evaluations SET c2_score = 1 WHERE evaluatee_id = $1 AND group_id = $2', [s3Id, groupId]);

        console.log(`6. S3 (${evaluateeEmail}) logs in and views snapshot...`);
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: evaluateeEmail, password: 'password123' })
        });
        let s3Token = (await res.json()).data.accessToken;

        const getRes = await fetch(`${API_URL}/analytics/assignments/${assignmentId}/groups/${groupId}/analytics`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s3Token}` },
        });
        
        const data = await getRes.json();
        const s3Snapshot = data.data.find(d => d.userId === s3Id);
        console.log(`S3 Data returned: isPublished=${s3Snapshot.isPublished}, c2=${s3Snapshot.c2}`);
        if (s3Snapshot.c2 === 5) {
            console.log('✅ IMMUTABLE SNAPSHOT VERIFIED! DB was changed to 1, but API returned 5.');
        } else {
            console.log('❌ SNAPSHOT FAILED! API returned new data.');
        }
        
    } catch (error) {
        console.error('Demo error:', error.message || error);
    } finally {
        pool.end();
    }
}

runDemo();
