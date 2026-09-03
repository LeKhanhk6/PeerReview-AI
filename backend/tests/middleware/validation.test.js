import { jest } from '@jest/globals';
import { validate } from '../../src/middleware/validation.middleware.js';
import { z } from 'zod';

describe('validation.middleware - validate', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            query: {},
            params: {}
        };
        res = {};
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call next if validation passes', () => {
        const schema = {
            body: z.object({
                name: z.string()
            })
        };
        
        req.body = { name: 'John Doe' };
        
        const middleware = validate(schema);
        middleware(req, res, next);
        
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });

    it('should pass error to next if validation fails', () => {
        const schema = {
            body: z.object({
                name: z.string()
            })
        };
        
        req.body = { age: 30 }; // missing 'name'
        
        const middleware = validate(schema);
        middleware(req, res, next);
        
        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error.message).toContain('Validation failed');
    });

    it('should pass error to next for invalid UUID in params', () => {
        const schema = {
            params: z.object({
                id: z.string().uuid()
            })
        };
        
        req.params = { id: 'not-a-uuid' };
        
        const middleware = validate(schema);
        middleware(req, res, next);
        
        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error.message).toContain('Validation failed');
    });
});
