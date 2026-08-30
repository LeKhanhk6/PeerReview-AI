import { jest } from '@jest/globals';

const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
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
});

describe('admin.service - getDashboardOverview', () => {
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
    expect(mockPool.query).toHaveBeenNthCalledWith(
      2,
      'SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL'
    );
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
