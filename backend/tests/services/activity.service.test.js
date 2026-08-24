import { jest } from '@jest/globals';
import { AppError } from '../../src/utils/AppError.js';
import { ACTIVITY_TYPES } from '../../src/constants/index.js';

// Setup module mock for DB pool
jest.unstable_mockModule('../../src/config/db.js', () => ({
    default: {
        query: jest.fn()
    }
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.util.js', () => ({
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }
}));

const { default: poolMock } = await import('../../src/config/db.js');
const { logActivity, getGroupActivityStats, getGroupActivities } = await import('../../src/services/activity.service.js');
const { default: loggerMock } = await import('../../src/utils/logger.util.js');

describe('Activity Service (MVP)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    describe('logActivity', () => {
        it('should successfully log an activity', async () => {
            const mockLog = { id: 1, action_type: ACTIVITY_TYPES.TASK_CREATE };
            poolMock.query.mockResolvedValueOnce({ rows: [mockLog] });

            const result = await logActivity({
                groupId: 1,
                userId: 'user1',
                actionType: ACTIVITY_TYPES.TASK_CREATE,
                targetId: 'task1',
                contentSummary: 'Created task 1'
            });

            expect(result).toEqual(mockLog);
            expect(poolMock.query).toHaveBeenCalledTimes(1);
        });

        it('should silently handle errors and log them structurally (Fire-and-forget)', async () => {
            const errorMsg = 'DB timeout';
            const dbError = new Error(errorMsg);
            dbError.statusCode = 503;
            poolMock.query.mockRejectedValueOnce(dbError);

            const result = await logActivity({
                groupId: 1,
                userId: 'user1',
                actionType: ACTIVITY_TYPES.TASK_CREATE,
                targetId: 'task1'
            });

            expect(result).toBeNull();
            expect(loggerMock.error).toHaveBeenCalled();
        });
    });

    describe('getGroupActivityStats', () => {
        it('should return stats on success', async () => {
            const mockStats = [{ user_id: 'user1', action_type: 'TASK_CREATE', total: "5" }];
            poolMock.query.mockResolvedValueOnce({ rows: mockStats });

            const result = await getGroupActivityStats(1, { from: '2023-01-01', to: '2023-12-31' });
            expect(result).toEqual(mockStats);
        });

        it('should throw AppError if no timeframe provided', async () => {
            await expect(getGroupActivityStats(1, {})).rejects.toThrow(AppError);
        });

        it('should fallback to [] on DB driver error (null rows)', async () => {
            poolMock.query.mockResolvedValueOnce(null);
            const result = await getGroupActivityStats(1, { from: '2023-01-01' });
            expect(result).toEqual([]);
        });

        it('should fallback to [] on DB crash', async () => {
            global.allowConsoleError();
            poolMock.query.mockRejectedValueOnce(new Error('Crash'));
            const result = await getGroupActivityStats(1, { from: '2023-01-01' });
            expect(result).toEqual([]);
            expect(loggerMock.error).toHaveBeenCalled();
        });
    });

    describe('getGroupActivities', () => {
        it('should return activities and hasNext=false when results <= limit', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] }); // limit is 10, got 2
            
            const result = await getGroupActivities(1, 10, 0);
            
            expect(result.data.length).toBe(2);
            expect(result.hasNext).toBe(false);
            expect(poolMock.query).toHaveBeenCalledWith(
                expect.stringContaining('LIMIT $2 OFFSET $3'),
                [1, 11, 0] // fetchLimit = limit + 1
            );
        });

        it('should clamp limit max 1000 and calculate hasNext=true when results > limit', async () => {
            const mockRows = Array(1001).fill({ id: 1 }); // 1001 items
            poolMock.query.mockResolvedValueOnce({ rows: mockRows });
            
            // requesting 2000, but clamped to 1000
            const result = await getGroupActivities(1, 2000, 0);
            
            expect(result.data.length).toBe(1000); // popped the 1001st
            expect(result.hasNext).toBe(true);
            expect(poolMock.query).toHaveBeenCalledWith(
                expect.any(String),
                [1, 1001, 0] // 1000 + 1
            );
        });

        it('should fallback to [] with hasNext=false on DB crash', async () => {
            global.allowConsoleError();
            poolMock.query.mockRejectedValueOnce(new Error('Crash'));
            
            const result = await getGroupActivities(1, 10);
            
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBe(0);
            expect(result.hasNext).toBe(false);
            expect(loggerMock.error).toHaveBeenCalled();
        });
    });
});
