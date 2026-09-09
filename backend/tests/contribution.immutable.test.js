import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/db.js', () => ({
    default: {
        query: jest.fn(),
        connect: jest.fn().mockResolvedValue({
            query: jest.fn(),
            release: jest.fn()
        })
    }
}));

const { getAssignmentGroupAnalytics, publishAssignmentContributions } = await import('../src/services/contribution.service.js');
const { publishGroupAnalytics } = await import('../src/controllers/analytics.controller.js');
const { default: pool } = await import('../src/config/db.js');

describe('Task 5: Teacher Analytics & Immutable Snapshot', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Service: Immutable Snapshot', () => {
        it('1. Đã publish -> lấy dữ liệu snapshot bất biến (bỏ qua data thật)', async () => {
            // Mock pool.query for getAssignmentGroupAnalytics
            pool.query.mockResolvedValueOnce({
                rowCount: 1,
                rows: [{
                    user_id: 'u1',
                    contribution_score: 110,
                    classification: 'HIGH_CONTRIBUTOR',
                    metadata: { c1: 90, c2: 4, c3: 4, c4: 5, si: 0.95, votes: 2, multiplier: 1.1 },
                    calculated_at: new Date()
                }]
            });

            const results = await getAssignmentGroupAnalytics('assig1', 'group1');
            
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(pool.query.mock.calls[0][0]).toContain('SELECT * FROM contribution_metrics');
            
            // Verify snapshot is parsed correctly
            expect(results.length).toBe(1);
            expect(results[0].isPublished).toBe(true);
            expect(results[0].c1).toBe(90);
            expect(results[0].classification).toBe('HIGH_CONTRIBUTOR');
        });

        it('2. Chưa publish -> tính toán live', async () => {
            // First call: SELECT * FROM contribution_metrics -> rowCount: 0
            pool.query.mockImplementation((query) => {
                if (query.includes('FROM contribution_metrics')) {
                    return Promise.resolve({ rowCount: 0, rows: [] });
                }
                if (query.includes('FROM group_members')) return Promise.resolve({ rows: [{ user_id: 'u1' }] });
                if (query.includes('FROM internal_evaluations')) return Promise.resolve({ rows: [] });
                if (query.includes('FROM tasks')) return Promise.resolve({ rows: [] });
                if (query.includes('FROM activity_logs')) return Promise.resolve({ rows: [] });
                return Promise.resolve({ rows: [] });
            });

            const results = await getAssignmentGroupAnalytics('assig1', 'group1');
            
            expect(results.length).toBe(1);
            expect(results[0].isPublished).toBe(false);
            expect(results[0].si).toBe(0); // From default live calculation
        });
    });

    describe('Controller: publishGroupAnalytics', () => {
        let req, res;
        beforeEach(() => {
            req = {
                params: { assignmentId: 'a1', groupId: 'g1' },
                user: { id: 'teacher1', role: { name: 'TEACHER' } }
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                ok: jest.fn()
            };
        });

        it('3. Publish sai lớp (Teacher không phụ trách) -> 403', async () => {
            pool.query.mockResolvedValueOnce({
                rowCount: 1,
                rows: [{ teacher_id: 'teacher_khac', deadline: new Date(Date.now() - 100000) }]
            });

            await publishGroupAnalytics(req, res);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('Bạn không có quyền') });
        });

        it('4. Publish khi chưa đóng window -> 400', async () => {
            pool.query.mockResolvedValueOnce({
                rowCount: 1,
                // Deadline in the future
                rows: [{ teacher_id: 'teacher1', deadline: new Date(Date.now() + 100000) }]
            });

            await publishGroupAnalytics(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('chưa kết thúc') });
        });
        
        it('5. Republish -> ghi đè dữ liệu cũ bằng ON CONFLICT DO UPDATE', async () => {
            // Arrange
            pool.query.mockResolvedValueOnce({
                rowCount: 1,
                rows: [{ teacher_id: 'teacher1', deadline: new Date(Date.now() - 100000000) }] // Past deadline -> window closed
            });
            pool.query.mockResolvedValueOnce({
                rowCount: 1,
                rows: [{ count: '2' }] // At least 1 evaluation
            });
            
            // Mock calculate live for publishAssignmentContributions
            pool.query.mockImplementation((query) => {
                if (query.includes('FROM group_members')) return Promise.resolve({ rows: [{ user_id: 'u1' }] });
                if (query.includes('FROM internal_evaluations')) return Promise.resolve({ rows: [] });
                if (query.includes('FROM tasks')) return Promise.resolve({ rows: [] });
                if (query.includes('FROM activity_logs')) return Promise.resolve({ rows: [] });
                return Promise.resolve({ rows: [], rowCount: 1 }); // Default fallback for other queries
            });

            // Mock the client from pool.connect
            const mockClient = await pool.connect();
            mockClient.query.mockResolvedValue({});

            // Act
            await publishGroupAnalytics(req, res);

            // Assert
            expect(res.ok).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            
            const insertQuery = mockClient.query.mock.calls.find(call => call[0].includes('INSERT INTO contribution_metrics'));
            expect(insertQuery).toBeDefined();
            expect(insertQuery[0]).toContain('ON CONFLICT (assignment_id, group_id, user_id)');
            expect(insertQuery[0]).toContain('DO UPDATE SET');
            expect(insertQuery[0]).toContain('metadata = EXCLUDED.metadata');
            
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });
    });
});
