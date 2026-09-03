import { jest } from '@jest/globals';

const mockSystemConfig = {
    getSystemConfigValue: jest.fn()
};

const mockDb = {
    query: jest.fn()
};

jest.unstable_mockModule('../../src/services/system-config.service.js', () => mockSystemConfig);
jest.unstable_mockModule('../../src/config/db.js', () => ({ default: mockDb }));

describe('ai-rate-limit.middleware', () => {
    let dynamicAiRateLimiter;
    let req, res, next;

    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();
        
        // Remock
        jest.unstable_mockModule('../../src/services/system-config.service.js', () => mockSystemConfig);
        jest.unstable_mockModule('../../src/config/db.js', () => ({ default: mockDb }));
        
        const module = await import('../../src/middleware/ai-rate-limit.middleware.js');
        dynamicAiRateLimiter = module.dynamicAiRateLimiter;

        req = {
            user: { id: 'user-1' },
            ip: '127.0.0.1'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should allow requests within the limit', async () => {
        // limit = 2
        mockSystemConfig.getSystemConfigValue.mockResolvedValue('2');
        
        // request 1
        await dynamicAiRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        
        // request 2
        await dynamicAiRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(2);
    });

    it('should block requests exceeding the limit with 429 Too Many Requests', async () => {
        // change user to isolate state
        req.user = { id: 'user-rate-limited' };
        // limit = 1
        mockSystemConfig.getSystemConfigValue.mockResolvedValue('1');
        
        // request 1 (Allowed)
        await dynamicAiRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        
        // request 2 (Blocked)
        await dynamicAiRateLimiter(req, res, next);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: expect.objectContaining({
                code: 'RATE_LIMITED'
            })
        }));
        
        // The mockDb.query should be called to log the rate limited metric
        await new Promise(resolve => process.nextTick(resolve));
        expect(mockDb.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO ai_requests'),
            expect.arrayContaining(['user-rate-limited', 'AI_MENTOR', null, 0, 0, 0, 0, 'rate_limited'])
        );
    });

    it('should use default limit 30 if config is invalid', async () => {
        req.user = { id: 'user-invalid-config' };
        mockSystemConfig.getSystemConfigValue.mockResolvedValue('invalid'); // fallback to 30
        
        await dynamicAiRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
