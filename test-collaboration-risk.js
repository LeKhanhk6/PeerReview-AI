import { getCollaborationRisks } from './backend/src/services/analytics.service.js';
import pool from './backend/src/config/db.js';

// MOCK pool.query
const mockQuery = async (queryStr, params) => {
    // 1. Validate ownership
    if (queryStr.includes('teacher_id FROM classes')) {
        return { rowCount: 1, rows: [{ teacher_id: 'teacher-1' }] };
    }
    
    // 2. groups
    if (queryStr.includes('id, name, created_at FROM groups')) {
        return {
            rows: [
                { id: 'group-dead', name: 'Nhóm 1 (Dead)', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
                { id: 'group-active', name: 'Nhóm 2 (Active)', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
                { id: 'group-1member', name: 'Nhóm 3 (1 Member)', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
                { id: 'group-perfect', name: 'Nhóm 4 (Perfect)', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
                { id: 'group-dedupe', name: 'Nhóm 5 (Dedupe)', created_at: new Date(Date.now() - 5 * 86400000).toISOString() }
            ]
        };
    }
    
    // 3. members
    if (queryStr.includes('group_members gm')) {
        return {
            rows: [
                { group_id: 'group-dead', user_id: 'u-d1', name: 'Dead User 1' },
                { group_id: 'group-dead', user_id: 'u-d2', name: 'Dead User 2' },
                
                { group_id: 'group-active', user_id: 'u-a1', name: 'Active User 1' },
                { group_id: 'group-active', user_id: 'u-a2', name: 'Active User 2' },
                
                { group_id: 'group-1member', user_id: 'u-m1', name: 'Lone Wolf' },
                
                { group_id: 'group-perfect', user_id: 'u-p1', name: 'Perfect 1' },
                { group_id: 'group-perfect', user_id: 'u-p2', name: 'Perfect 2' },

                { group_id: 'group-dedupe', user_id: 'u-dd1', name: 'Dedupe User 1' },
                { group_id: 'group-dedupe', user_id: 'u-dd2', name: 'Dedupe User 2' }
            ]
        };
    }
    
    // 4. activities
    if (queryStr.includes('activity_logs al')) {
        return {
            rows: [
                // group-dead: 0 activities
                
                // group-active: total > 5. u-a1 has 10. u-a2 has 0 (LOW_ACTIVITY & LOW_CONTRIBUTION).
                { group_id: 'group-active', user_id: 'u-a1', action_count: 10 },
                
                // group-1member: total > 5
                { group_id: 'group-1member', user_id: 'u-m1', action_count: 6 },
                
                // group-perfect: balanced
                { group_id: 'group-perfect', user_id: 'u-p1', action_count: 5 },
                { group_id: 'group-perfect', user_id: 'u-p2', action_count: 6 },

                // group-dedupe: user u-d1 has 0 activity. (we will test dedupe by forcing the engine to run twice on this or modifying a rule to return multiple same risks)
                { group_id: 'group-dedupe', user_id: 'u-dd1', action_count: 0 },
                { group_id: 'group-dedupe', user_id: 'u-dd2', action_count: 10 }
            ]
        };
    }
    
    // 5. tasks
    if (queryStr.includes('t.assignee_id, t.status')) {
        return {
            rows: [
                // group-active: total 5 tasks. u-a1 has 5 tasks. maxContribution > 0.8
                { group_id: 'group-active', assignee_id: 'u-a1', status: 'DONE' },
                { group_id: 'group-active', assignee_id: 'u-a1', status: 'DONE' },
                { group_id: 'group-active', assignee_id: 'u-a1', status: 'DONE' },
                { group_id: 'group-active', assignee_id: 'u-a1', status: 'DONE' },
                { group_id: 'group-active', assignee_id: 'u-a1', status: 'TODO' },
                
                // group-perfect
                { group_id: 'group-perfect', assignee_id: 'u-p1', status: 'DONE' },
                { group_id: 'group-perfect', assignee_id: 'u-p2', status: 'DONE' },
                
                // group-1member: 5 tasks, 1 person does all (maxContribution = 1.0) -> SHOULD NOT FLAG UNBALANCED due to memberCount=1
                { group_id: 'group-1member', assignee_id: 'u-m1', status: 'DONE' },
                { group_id: 'group-1member', assignee_id: 'u-m1', status: 'DONE' },
                { group_id: 'group-1member', assignee_id: 'u-m1', status: 'DONE' },
                { group_id: 'group-1member', assignee_id: 'u-m1', status: 'DONE' },
                { group_id: 'group-1member', assignee_id: 'u-m1', status: 'DONE' }
            ]
        };
    }
    
    // 6. tasks_created
    if (queryStr.includes('tasks_created')) {
        return { rows: [] };
    }
    
    // 7. assignments
    if (queryStr.includes('id, title, deadline')) {
        return {
            rows: [
                { id: 'a1', title: 'Ass 1', deadline: new Date(Date.now() + 1 * 86400000).toISOString() } // Deadline in 1 day (triggers incomplete tasks logic if rate < 0.3)
            ]
        };
    }
    
    // 8. reviews
    if (queryStr.includes('review_assignments ra')) {
        return {
            rows: []
        }
    }
    
    return { rows: [] };
};

pool.query = mockQuery;

(async () => {
    try {
        const currentUser = { role: 'TEACHER', userId: 'teacher-1' };
        const risks = await getCollaborationRisks(currentUser, 'class-1');
        
        console.log("=== COLLABORATION RISKS ===");
        console.log(JSON.stringify(risks, null, 2));
        
        console.log("\n=== TEST RESULTS ===");
        
        // 1. Check group-dead
        const deadRisk = risks.find(r => r.groupId === 'group-dead' && r.riskType === 'DEAD_GROUP');
        console.log(`1. DEAD_GROUP triggered correctly: ${!!deadRisk}`);
        
        const deadUserRisk = risks.find(r => r.groupId === 'group-dead' && r.riskType === 'LOW_ACTIVITY');
        console.log(`1.1 DEAD_GROUP skipped user-level risks: ${!deadUserRisk}`);
        
        // 2. Check group-active (u-a2 has LOW_ACTIVITY and LOW_CONTRIBUTION)
        const lowActRisk = risks.find(r => r.userId === 'u-a2' && r.riskType === 'LOW_ACTIVITY');
        const lowContRisk = risks.find(r => r.userId === 'u-a2' && r.riskType === 'LOW_CONTRIBUTION');
        console.log(`2. Multi-risk check (LOW_ACTIVITY & LOW_CONTRIBUTION for same user): ${!!lowActRisk && !!lowContRisk}`);
        
        // 3. Check unbalanced (group-active has maxContribution > 0.8 and memberCount >= 2)
        const unbalanced = risks.find(r => r.groupId === 'group-active' && r.riskType === 'UNBALANCED_CONTRIBUTION');
        console.log(`3. UNBALANCED_CONTRIBUTION triggered correctly: ${!!unbalanced}`);
        
        // 4. Check group size = 1 guard
        const unbal1Mem = risks.find(r => r.groupId === 'group-1member' && r.riskType === 'UNBALANCED_CONTRIBUTION');
        console.log(`4. Group size = 1 guard working: ${!unbal1Mem}`);
        
        // 5. Check group-perfect (No risks)
        const perfectRisks = risks.filter(r => r.groupId === 'group-perfect');
        console.log(`5. No-risk case (Perfect group has 0 risks): ${perfectRisks.length === 0}`);
        
        // 6. Check dedupe (u-dd1 has LOW_ACTIVITY and LOW_CONTRIBUTION, total 2 risks, no duplicates of the same type)
        const dedupeRisks = risks.filter(r => r.userId === 'u-dd1');
        const uniqueDedupeTypes = new Set(dedupeRisks.map(r => r.riskType));
        console.log(`6. Deduplicate risks working (user has exactly 1 of each risk type): ${dedupeRisks.length === uniqueDedupeTypes.size && dedupeRisks.length > 0}`);

        // 7. Check sorting
        const sorted = [...risks].sort((a,b)=>b.score-a.score);
        const isSorted = risks.every((r,i)=>r === sorted[i]);
        console.log(`7. Sorting by score correct: ${isSorted}`);

        // 8. Check max cap
        console.log(`8. Max cap <= 50: ${risks.length <= 50}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
