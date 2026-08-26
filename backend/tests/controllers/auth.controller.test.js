import { jest } from '@jest/globals';
import { AppError } from '../../src/utils/AppError.js';

const mockAuthService = {
    getUserById: jest.fn()
};

jest.unstable_mockModule('../../src/services/auth.service.js', () => mockAuthService);

let getMe;

beforeEach(async () => {
    jest.resetModules();
    
    // Remock
    jest.unstable_mockModule('../../src/services/auth.service.js', () => mockAuthService);
    
    // Re-import the controller
    const authController = await import('../../src/controllers/auth.controller.js');
    getMe = authController.getMe;
    
    mockAuthService.getUserById.mockReset();
});

describe('auth.controller - getMe', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { id: 'user-123' }
        };
        res = {
            ok: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        delete process.env.AUDIT_ENABLED;
    });

    it('should throw Unauthorized if no user id', async () => {
        req.user = null;
        await getMe(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ 
            statusCode: 401, 
            message: 'Unauthorized' 
        }));
    });

    describe('Audit Capability', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@test.com',
            full_name: 'Test User',
            role: 'TEACHER',
            created_at: '2026-01-01'
        };

        beforeEach(() => {
            mockAuthService.getUserById.mockResolvedValue(mockUser);
        });

        it('should return audit_enabled true when AUDIT_ENABLED="true"', async () => {
            process.env.AUDIT_ENABLED = 'true';
            
            await getMe(req, res, next);

            expect(res.ok).toHaveBeenCalledWith({
                user: {
                    ...mockUser,
                    capabilities: {
                        audit_enabled: true
                    }
                }
            });
        });

        it('should return audit_enabled false when AUDIT_ENABLED="false"', async () => {
            process.env.AUDIT_ENABLED = 'false';
            
            await getMe(req, res, next);

            expect(res.ok).toHaveBeenCalledWith(expect.objectContaining({
                user: expect.objectContaining({
                    capabilities: { audit_enabled: false }
                })
            }));
        });

        it('should return audit_enabled false when AUDIT_ENABLED is missing', async () => {
            delete process.env.AUDIT_ENABLED;
            
            await getMe(req, res, next);

            expect(res.ok).toHaveBeenCalledWith(expect.objectContaining({
                user: expect.objectContaining({
                    capabilities: { audit_enabled: false }
                })
            }));
        });

        it('should return audit_enabled false when AUDIT_ENABLED is invalid ("TRUE", "invalid", empty)', async () => {
            const invalidValues = ['TRUE', 'invalid', ''];
            
            for (const val of invalidValues) {
                process.env.AUDIT_ENABLED = val;
                await getMe(req, res, next);
                
                expect(res.ok).toHaveBeenCalledWith(expect.objectContaining({
                    user: expect.objectContaining({
                        capabilities: { audit_enabled: false }
                    })
                }));
                res.ok.mockClear();
            }
        });
    });
});
