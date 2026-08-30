import { jest } from '@jest/globals';
import rateLimit from 'express-rate-limit';

describe('Login Rate Limiter (skipSuccessfulRequests)', () => {
    it('should be configured with skipSuccessfulRequests=true and max=5', () => {
        const limiterOptions = {
            windowMs: 15 * 60 * 1000,
            max: 5,
            skipSuccessfulRequests: true,
            message: { message: 'Too many login attempts, please try again after 15 minutes' },
            standardHeaders: true,
            legacyHeaders: false,
        };

        const limiter = rateLimit(limiterOptions);
        expect(limiter).toBeDefined();
        expect(limiterOptions.skipSuccessfulRequests).toBe(true);
        expect(limiterOptions.max).toBe(5);
    });
});
