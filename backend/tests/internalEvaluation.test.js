import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/db.js', () => ({
    default: {
        query: jest.fn(),
        connect: jest.fn()
    }
}));

const { calculateAssignmentContributions } = await import('../src/services/contribution.service.js');
const { submitEvaluation } = await import('../src/controllers/internalEvaluation.controller.js');
const { default: pool } = await import('../src/config/db.js');

describe('Internal Evaluation & Contribution Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Service: calculateAssignmentContributions', () => {
        
        it('1. M=2 (nhóm 2 người)', async () => {
            pool.query.mockImplementation((query, params) => {
                if (query.includes('FROM group_members')) {
                    return Promise.resolve({ rows: [{ user_id: 'user1' }, { user_id: 'user2' }] });
                }
                if (query.includes('FROM internal_evaluations')) {
                    return Promise.resolve({ rows: [
                        { evaluatee_id: 'user1', avg_c2: 4, avg_c3: 4, avg_c4: 4, votes: 1 },
                        { evaluatee_id: 'user2', avg_c2: 5, avg_c3: 5, avg_c4: 5, votes: 1 }
                    ]});
                }
                if (query.includes('FROM tasks')) {
                    return Promise.resolve({ rows: [{ status: 'DONE' }] }); 
                }
                if (query.includes('FROM activity_logs')) {
                    return Promise.resolve({ rows: [{ user_id: 'user1', count: 5 }, { user_id: 'user2', count: 5 }] }); 
                }
                return Promise.resolve({ rows: [] });
            });

            const results = await calculateAssignmentContributions('assig1', 'group1');
            expect(results.length).toBe(2);
            expect(results[0].userId).toBe('user1');
            expect(results[1].userId).toBe('user2');
            expect(results[0].votes).toBe(1);
            expect(results[1].votes).toBe(1);
        });

        it('2. Một thành viên không chấm → mean từ phiếu thật', async () => {
            pool.query.mockImplementation((query) => {
                if (query.includes('FROM group_members')) return Promise.resolve({ rows: [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u3' }] });
                if (query.includes('FROM internal_evaluations')) {
                    return Promise.resolve({ rows: [
                        { evaluatee_id: 'u2', avg_c2: 5, avg_c3: 5, avg_c4: 5, votes: 1 },
                        { evaluatee_id: 'u1', avg_c2: 3, avg_c3: 3, avg_c4: 3, votes: 2 },
                        { evaluatee_id: 'u3', avg_c2: 4, avg_c3: 4, avg_c4: 4, votes: 2 }
                    ]});
                }
                if (query.includes('FROM tasks')) return Promise.resolve({ rows: [] }); 
                if (query.includes('FROM activity_logs')) return Promise.resolve({ rows: [] });
                return Promise.resolve({ rows: [] });
            });
            const results = await calculateAssignmentContributions('a', 'g');
            const u2 = results.find(r => r.userId === 'u2');
            expect(u2.c2).toBe(5); 
            expect(u2.votes).toBe(1); 
        });

        it('3. C1=0% (Service)', async () => {
            pool.query.mockImplementation((query) => {
                if (query.includes('FROM group_members')) return Promise.resolve({ rows: [{ user_id: 'u1' }] });
                if (query.includes('FROM internal_evaluations')) return Promise.resolve({ rows: [] });
                if (query.includes('FROM tasks')) return Promise.resolve({ rows: [{ status: 'TODO' }] }); 
                if (query.includes('FROM activity_logs')) return Promise.resolve({ rows: [] }); 
                return Promise.resolve({ rows: [] });
            });
            const results = await calculateAssignmentContributions('a', 'g');
            expect(results[0].c1).toBe(0);
        });

        it('7. mean(S)=0 → multiplier=1', async () => {
            pool.query.mockImplementation((query) => {
                if (query.includes('FROM group_members')) return Promise.resolve({ rows: [{ user_id: 'u1' }, { user_id: 'u2' }] });
                if (query.includes('FROM internal_evaluations')) return Promise.resolve({ rows: [] });
                if (query.includes('FROM tasks')) return Promise.resolve({ rows: [] }); 
                if (query.includes('FROM activity_logs')) return Promise.resolve({ rows: [] });
                return Promise.resolve({ rows: [] });
            });
            const results = await calculateAssignmentContributions('a', 'g');
            expect(results[0].si).toBe(0);
            expect(results[1].si).toBe(0);
            expect(results[0].multiplier).toBe(1.0); 
            expect(results[1].multiplier).toBe(1.0);
        });

        it('8. Mọi phiếu chấm đều nhau → G_ind = G_group', async () => {
            pool.query.mockImplementation((query) => {
                if (query.includes('FROM group_members')) return Promise.resolve({ rows: [{ user_id: 'u1' }, { user_id: 'u2' }] });
                if (query.includes('FROM internal_evaluations')) {
                    return Promise.resolve({ rows: [
                        { evaluatee_id: 'u1', avg_c2: 5, avg_c3: 5, avg_c4: 5, votes: 1 },
                        { evaluatee_id: 'u2', avg_c2: 5, avg_c3: 5, avg_c4: 5, votes: 1 }
                    ]});
                }
                if (query.includes('FROM tasks')) return Promise.resolve({ rows: [{ status: 'DONE' }] });
                if (query.includes('FROM activity_logs')) return Promise.resolve({ rows: [] });
                return Promise.resolve({ rows: [] });
            });
            const results = await calculateAssignmentContributions('a', 'g');
            expect(results[0].multiplier).toBe(1.0); 
            expect(results[1].multiplier).toBe(1.0);
        });
    });

    describe('Controller: submitEvaluation', () => {
        let req, res;
        beforeEach(() => {
            req = {
                params: { assignmentId: 'a1', groupId: 'g1' },
                body: { evaluateeId: 'u2', c2_score: 5, c3_score: 5, c4_score: 5 },
                user: { id: 'u1' }
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
        });

        it('4. Tự chấm → 400', async () => {
            req.body.evaluateeId = 'u1'; // Same as evaluator
            await submitEvaluation(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('tự chấm') });
        });

        it('5. Window chưa mở → 400', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // pubCheck
            pool.query.mockResolvedValueOnce({ rows: [{ due_date: futureDate }] });
            
            await submitEvaluation(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('Chưa đến thời gian') });
        });

        it('5. Window đã đóng → 400', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 2);
            const reviewPast = new Date();
            reviewPast.setDate(reviewPast.getDate() - 1);
            
            pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // pubCheck
            pool.query.mockResolvedValueOnce({ rows: [{ due_date: pastDate, review_deadline: reviewPast }] });
            
            await submitEvaluation(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('đã kết thúc') });
        });

        it('6. Member ngoài group → 403', async () => {
            const past = new Date(Date.now() - 10000);
            const future = new Date(Date.now() + 1000000);
            pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // pubCheck
            pool.query.mockResolvedValueOnce({ rows: [{ due_date: past, review_deadline: future }] });
            
            // Evaluator not in group
            pool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u2' }, { user_id: 'u3' }] }); 

            await submitEvaluation(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('Bạn không thuộc nhóm') });
        });

        it('9. Chấm trùng → ON CONFLICT DO UPDATE', async () => {
            const past = new Date(Date.now() - 10000);
            const future = new Date(Date.now() + 1000000);
            pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // pubCheck
            pool.query.mockResolvedValueOnce({ rows: [{ due_date: past, review_deadline: future }] });
            pool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }, { user_id: 'u2' }] });

            await submitEvaluation(req, res);
            
            expect(res.status).toHaveBeenCalledWith(201);
            const insertQuery = pool.query.mock.calls[3][0];
            expect(insertQuery).toContain('ON CONFLICT (assignment_id, evaluator_id, evaluatee_id)');
            expect(insertQuery).toContain('DO UPDATE SET');
            expect(insertQuery).toContain('updated_at = NOW()');
        });

        it('10. Đã công bố kết quả -> 400 (Không cho chỉnh sửa)', async () => {
            pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'metric-1' }] }); // pubCheck published

            await submitEvaluation(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('đã công bố') });
        });

        it('11. allow_early_internal_eval = true -> Cho phép chấm ngay cả khi chưa đến deadline', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // pubCheck
            pool.query.mockResolvedValueOnce({ rows: [{ deadline: futureDate, allow_early_internal_eval: true }] });
            pool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }, { user_id: 'u2' }] }); // members

            await submitEvaluation(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'Lưu đánh giá thành công' });
        });
    });
});

