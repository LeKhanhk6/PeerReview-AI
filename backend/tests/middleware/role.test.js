import { jest } from '@jest/globals';
import { authorizeRoles } from '../../src/middleware/role.middleware.js';

describe('role.middleware - authorizeRoles', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: {} // mock user
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call next if user has an authorized role', () => {
        req.user = { role: 'TEACHER' };
        
        const middleware = authorizeRoles('TEACHER', 'ADMIN');
        middleware(req, res, next);
        
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });

    it('should return 403 Forbidden if user role is not authorized', () => {
        req.user = { role: 'STUDENT' };
        
        const middleware = authorizeRoles('TEACHER', 'ADMIN');
        middleware(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('Forbidden')
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 Unauthorized if user object is missing in req', () => {
        req.user = null;
        
        const middleware = authorizeRoles('STUDENT');
        middleware(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('Unauthorized')
        }));
        expect(next).not.toHaveBeenCalled();
    });
});
