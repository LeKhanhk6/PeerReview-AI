import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/config/db.js', () => ({
    default: {
        query: jest.fn()
    }
}));

const { getCollaborationRisks } = await import('../../src/services/analytics.service.js');
const { default: pool } = await import('../../src/config/db.js');

const buildMockDbResults = ({
    groups = [],
    members = [],
    activities = [],
    tasks = [],
    tasksCreated = [],
    assignments = [],
    reviews = []
}) => {
    pool.query.mockImplementation(async (queryStr) => {
        if (queryStr.includes('teacher_id FROM classes')) return { rowCount: 1, rows: [{ teacher_id: 'teacher-1' }] };
        if (queryStr.includes('id, name, created_at FROM groups')) return { rows: groups };
        if (queryStr.includes('group_members gm')) return { rows: members };
        if (queryStr.includes('activity_logs al')) return { rows: activities };
        if (queryStr.includes('t.assignee_id, t.status')) return { rows: tasks };
        if (queryStr.includes('tasks_created')) return { rows: tasksCreated };
        if (queryStr.includes('title, deadline')) return { rows: assignments };
        if (queryStr.includes('review_assignments ra')) return { rows: reviews };
        return { rows: [] };
    });
};

const currentUser = { role: 'TEACHER', userId: 'teacher-1' };
const classId = 'class-1';
const now = Date.now();
const daysAgo = (days) => new Date(now - days * 86400000).toISOString();
const daysFuture = (days) => new Date(now + days * 86400000).toISOString();

describe('getCollaborationRisks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Case 1: DEAD_GROUP', async () => {
        buildMockDbResults({
            groups: [{ id: 'g1', name: 'G1', created_at: daysAgo(3) }],
            members: [{ group_id: 'g1', user_id: 'u1', name: 'User 1' }],
            activities: []
        });

        const risks = await getCollaborationRisks(currentUser, classId);
        
        expect(risks).toHaveLength(1);
        expect(risks[0].riskType).toBe('DEAD_GROUP');
        expect(risks[0].entityType).toBe('GROUP');

        const userRisks = risks.filter(r => r.entityType === 'USER');
        expect(userRisks.length).toBe(0);
    });

    test('Case 2: LOW_ACTIVITY + LOW_CONTRIBUTION (multi-risk)', async () => {
        buildMockDbResults({
            groups: [{ id: 'g1', name: 'G1', created_at: daysAgo(10) }],
            members: [
                { group_id: 'g1', user_id: 'u1', name: 'User 1' },
                { group_id: 'g1', user_id: 'u2', name: 'User 2' }
            ],
            activities: [
                { group_id: 'g1', user_id: 'u1', action_count: 10 }
            ],
            tasks: [
                { group_id: 'g1', assignee_id: 'u1', status: 'DONE' }
            ]
        });

        const risks = await getCollaborationRisks(currentUser, classId);
        
        const u2Risks = risks.filter(r => r.userId === 'u2');
        expect(u2Risks).toHaveLength(2);
        
        const riskTypes = u2Risks.map(r => r.riskType);
        expect(riskTypes).toContain('LOW_ACTIVITY');
        expect(riskTypes).toContain('LOW_CONTRIBUTION');
    });

    test('Case 3: UNBALANCED_CONTRIBUTION', async () => {
        buildMockDbResults({
            groups: [{ id: 'g1', name: 'G1', created_at: daysAgo(10) }],
            members: [
                { group_id: 'g1', user_id: 'u1', name: 'User 1' },
                { group_id: 'g1', user_id: 'u2', name: 'User 2' }
            ],
            activities: [
                { group_id: 'g1', user_id: 'u1', action_count: 10 },
                { group_id: 'g1', user_id: 'u2', action_count: 1 }
            ],
            tasks: [
                { group_id: 'g1', assignee_id: 'u1', status: 'DONE' },
                { group_id: 'g1', assignee_id: 'u1', status: 'DONE' },
                { group_id: 'g1', assignee_id: 'u1', status: 'DONE' },
                { group_id: 'g1', assignee_id: 'u1', status: 'DONE' },
                { group_id: 'g1', assignee_id: 'u1', status: 'DONE' }
            ],
            tasksCreated: [
                { group_id: 'g1', user_id: 'u1', tasks_created: 5 }
            ]
        });

        const risks = await getCollaborationRisks(currentUser, classId);
        
        const groupRisk = risks.find(r => r.riskType === 'UNBALANCED_CONTRIBUTION');
        expect(groupRisk).toBeDefined();
        expect(groupRisk.entityType).toBe('GROUP');
        expect(groupRisk.groupId).toBe('g1');
    });

    test('Case 4: INCOMPLETE_TASKS', async () => {
        buildMockDbResults({
            groups: [{ id: 'g1', name: 'G1', created_at: daysAgo(10) }],
            members: [{ group_id: 'g1', user_id: 'u1', name: 'User 1' }],
            activities: [{ group_id: 'g1', user_id: 'u1', action_count: 10 }],
            tasks: [
                { group_id: 'g1', assignee_id: 'u1', status: 'TODO' },
                { group_id: 'g1', assignee_id: 'u1', status: 'TODO' },
                { group_id: 'g1', assignee_id: 'u1', status: 'TODO' },
                { group_id: 'g1', assignee_id: 'u1', status: 'TODO' }
            ],
            assignments: [
                { id: 'a1', title: 'A1', deadline: daysFuture(1) }
            ]
        });

        const risks = await getCollaborationRisks(currentUser, classId);
        
        const risk = risks.find(r => r.riskType === 'INCOMPLETE_TASKS');
        expect(risk).toBeDefined();
    });

    test('Case 5: REVIEW_INACTIVITY', async () => {
        buildMockDbResults({
            groups: [{ id: 'g1', name: 'G1', created_at: daysAgo(10) }],
            members: [{ group_id: 'g1', user_id: 'u1', name: 'User 1' }],
            activities: [{ group_id: 'g1', user_id: 'u1', action_count: 10 }],
            assignments: [
                { id: 'a1', title: 'A1', deadline: daysAgo(2) }
            ],
            reviews: [
                { group_id: 'g1', status: 'PENDING' },
                { group_id: 'g1', status: 'PENDING' }
            ]
        });

        const risks = await getCollaborationRisks(currentUser, classId);
        
        const risk = risks.find(r => r.riskType === 'REVIEW_INACTIVITY');
        expect(risk).toBeDefined();
        expect(risk.severity).toBe('HIGH');
    });

    test('Case 6: PERFECT CASE', async () => {
        buildMockDbResults({
            groups: [{ id: 'g1', name: 'G1', created_at: daysAgo(10) }],
            members: [
                { group_id: 'g1', user_id: 'u1', name: 'User 1' },
                { group_id: 'g1', user_id: 'u2', name: 'User 2' }
            ],
            activities: [
                { group_id: 'g1', user_id: 'u1', action_count: 10 },
                { group_id: 'g1', user_id: 'u2', action_count: 10 }
            ],
            tasks: [
                { group_id: 'g1', assignee_id: 'u1', status: 'DONE' },
                { group_id: 'g1', assignee_id: 'u2', status: 'DONE' }
            ],
            assignments: [
                { id: 'a1', title: 'A1', deadline: daysFuture(10) }
            ],
            reviews: []
        });

        const risks = await getCollaborationRisks(currentUser, classId);
        expect(risks).toHaveLength(0);
    });

    test('Case 7: DEDUPLICATION', async () => {
        buildMockDbResults({
            groups: [{ id: 'g1', name: 'G1', created_at: daysAgo(10) }],
            members: [
                { group_id: 'g1', user_id: 'u1', name: 'User 1' },
                { group_id: 'g1', user_id: 'u2', name: 'User 2' },
                { group_id: 'g1', user_id: 'u2', name: 'User 2' } 
            ],
            activities: [
                { group_id: 'g1', user_id: 'u1', action_count: 10 },
                { group_id: 'g1', user_id: 'u2', action_count: 0 }
            ],
            tasks: []
        });

        const risks = await getCollaborationRisks(currentUser, classId);
        const lowActRisks = risks.filter(r => r.userId === 'u2' && r.riskType === 'LOW_ACTIVITY');
        expect(lowActRisks.length).toBe(1); 
    });

    test('Case 8: SORTING', async () => {
        buildMockDbResults({
            groups: [
                { id: 'g1', name: 'G1', created_at: daysAgo(3) }, 
                { id: 'g2', name: 'G2', created_at: daysAgo(10) }
            ],
            members: [
                { group_id: 'g2', user_id: 'u1', name: 'User 1' }
            ],
            activities: [
                { group_id: 'g2', user_id: 'u1', action_count: 0 }
            ],
            tasks: [
                { group_id: 'g2', assignee_id: 'u1', status: 'DONE' },
                { group_id: 'g2', assignee_id: 'u1', status: 'DONE' },
                { group_id: 'g2', assignee_id: 'u1', status: 'DONE' },
                { group_id: 'g2', assignee_id: 'u1', status: 'DONE' },
                { group_id: 'g2', assignee_id: 'u1', status: 'DONE' }
            ]
        });

        const risks = await getCollaborationRisks(currentUser, classId);
        expect(risks.length).toBeGreaterThan(1);
        for (let i = 0; i < risks.length - 1; i++) {
            expect(risks[i].score).toBeGreaterThanOrEqual(risks[i + 1].score);
        }
    });

    test('Case 9: GLOBAL CAP', async () => {
        const manyMembers = Array.from({ length: 60 }, (_, i) => ({
            group_id: 'g1', user_id: `u${i}`, name: `User ${i}`
        }));
        
        buildMockDbResults({
            groups: [{ id: 'g1', name: 'G1', created_at: daysAgo(10) }],
            members: manyMembers,
            activities: [{ group_id: 'g1', user_id: 'u0', action_count: 10 }]
        });

        const risks = await getCollaborationRisks(currentUser, classId);
        expect(risks.length).toBeLessThanOrEqual(50);
    });

    test('Case 10: ERROR FALLBACK', async () => {
        pool.query.mockImplementation(async (queryStr) => {
            if (queryStr.includes('teacher_id FROM classes')) return { rowCount: 1, rows: [{ teacher_id: 'teacher-1' }] };
            throw new Error('DB connection failed');
        });
        const risks = await getCollaborationRisks(currentUser, classId);
        expect(risks).toEqual([]);
    });
});
