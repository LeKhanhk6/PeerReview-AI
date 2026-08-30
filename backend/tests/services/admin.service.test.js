import { jest } from '@jest/globals';

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue(mockClient),
};

jest.unstable_mockModule('../../src/config/db.js', () => ({
  default: mockPool,
}));

let adminService;

beforeEach(async () => {
  jest.resetModules();
  jest.unstable_mockModule('../../src/config/db.js', () => ({
    default: mockPool,
  }));
  adminService = await import('../../src/services/admin.service.js');
  mockPool.query.mockReset();
  mockClient.query.mockReset();
  mockClient.release.mockReset();
});

describe('admin.service', () => {
  describe('getDashboardOverview', () => {
    it('should return aggregated overview stats successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            { role: 'STUDENT', count: '10' },
            { role: 'TEACHER', count: '2' },
            { role: 'ADMIN', count: '1' },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // activeClasses (deleted_at IS NULL)
        .mockResolvedValueOnce({ rows: [{ count: '25' }] }) // totalSubmissions
        .mockResolvedValueOnce({ rows: [{ count: '40' }] }) // totalReviews
        .mockResolvedValueOnce({ rows: [{ count: '12' }] }); // aiRequests24h

      const result = await adminService.getDashboardOverview();

      expect(mockPool.query).toHaveBeenCalledTimes(5);
      expect(result).toEqual({
        users: {
          STUDENT: 10,
          TEACHER: 2,
          ADMIN: 1,
          TOTAL: 13,
        },
        activeClasses: 5,
        totalSubmissions: 25,
        totalReviews: 40,
        aiRequests24h: 12,
      });
    });
  });

  describe('getUsers', () => {
    it('should fetch users list with virtual status field without DB status column', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'user-1',
              email: 'test@example.com',
              fullName: 'Test User',
              role: 'STUDENT',
              status: 'ACTIVE',
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          ],
        });

      const res = await adminService.getUsers({ page: 1, limit: 10 });
      expect(res.users[0].status).toBe('ACTIVE');
      expect(res.total).toBe(1);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role using FOR UPDATE OF u syntax without outer join lock error', async () => {
      const currentUser = { userId: 'admin-1', role: 'ADMIN' };
      const targetUserId = 'student-1';
      const newRole = 'TEACHER';

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: targetUserId, email: 'student@example.com', full_name: 'Student One', role: 'STUDENT', status: 'ACTIVE' }],
        })
        .mockResolvedValueOnce({ rows: [{ id: 'role-teacher-uuid' }] })
        .mockResolvedValueOnce({ command: 'UPDATE' })
        .mockResolvedValueOnce({
          rows: [{ id: targetUserId, email: 'student@example.com', fullName: 'Student One', role: 'TEACHER', status: 'ACTIVE', updatedAt: '2026-01-01' }],
        })
        .mockResolvedValueOnce({ command: 'INSERT' })
        .mockResolvedValueOnce({ command: 'COMMIT' });

      const updated = await adminService.updateUserRole(currentUser, targetUserId, newRole);

      expect(updated.role).toBe('TEACHER');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('FOR UPDATE OF u'),
        [targetUserId]
      );
    });
  });
});
