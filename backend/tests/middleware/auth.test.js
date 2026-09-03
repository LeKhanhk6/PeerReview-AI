import { jest } from '@jest/globals';
import { AppError } from '../../src/utils/AppError.js';

const mockJwt = {
    verify: jest.fn()
};

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: mockJwt
}));

describe('auth.middleware - verifyToken', () => {
    let req, res, next;
    let verifyToken;

    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();
        
        jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
        jest.unstable_mockModule('../../src/utils/context.util.js', () => ({ setUserId: jest.fn() }));
        
        const authMiddleware = await import('../../src/middleware/auth.middleware.js');
        verifyToken = authMiddleware.verifyToken;
        
        req = {
            headers: {},
            cookies: {}
        };
        res = {};
        next = jest.fn();
    });

    it('should throw AppError 401 if no token provided in headers or cookies', () => {
        let error = null;
        try {
            verifyToken(req, res, next);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.statusCode).toBe(401);
        expect(error.message).toContain('No token provided');
        expect(next).not.toHaveBeenCalled();
    });

    it('should extract token from Authorization header and call next if valid', () => {
        req.headers.authorization = 'Bearer valid.token.here';
        const decodedPayload = { id: '123', role: 'STUDENT' };
        
        mockJwt.verify.mockReturnValue(decodedPayload);
        
        verifyToken(req, res, next);
        
        expect(mockJwt.verify).toHaveBeenCalledWith('valid.token.here', process.env.JWT_SECRET);
        expect(req.user.id).toEqual('123');
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should throw 401 if token is invalid', () => {
        req.headers.authorization = 'Bearer invalid.token';
        
        mockJwt.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });
        
        let error = null;
        try {
            verifyToken(req, res, next);
        } catch (e) {
            error = e;
        }
        
        expect(error).toBeDefined();
        expect(error.statusCode).toBe(401);
        expect(error.message).toContain('Token is not valid');
        expect(next).not.toHaveBeenCalled();
    });
});
