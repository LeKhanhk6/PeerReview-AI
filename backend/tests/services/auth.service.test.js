import { jest } from '@jest/globals';
import poolMock from '../__mocks__/db.mock.js';
import { createMockUserScenario, createMockDbUserRow } from '../factories/user.factory.js';

// Mock dependencies before importing the service
jest.unstable_mockModule('../../src/config/db.js', () => ({
    default: poolMock
}));

const mockBcrypt = {
    hash: jest.fn(),
    compare: jest.fn()
};
jest.unstable_mockModule('bcrypt', () => ({ default: mockBcrypt }));

const mockJwt = {
    sign: jest.fn()
};
// Setup environment variables needed by the service BEFORE importing it
process.env.JWT_SECRET = 'mock-secret-key';
process.env.JWT_EXPIRES_IN = '24h';

let loginUser, registerUser, getUserById, updateUserProfile, changeUserPassword, AppError;

beforeEach(async () => {
    jest.resetModules();
    
    // Remock dependencies for the fresh module
    jest.unstable_mockModule('../../src/config/db.js', () => ({ default: poolMock }));
    jest.unstable_mockModule('bcrypt', () => ({ default: mockBcrypt }));
    jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
    
    // Re-import the service
    const authService = await import('../../src/services/auth.service.js');
    loginUser = authService.loginUser;
    registerUser = authService.registerUser;
    getUserById = authService.getUserById;
    updateUserProfile = authService.updateUserProfile;
    changeUserPassword = authService.changeUserPassword;
    
    const appErrorModule = await import('../../src/utils/AppError.js');
    AppError = appErrorModule.AppError;
    
    poolMock.query.mockReset();
    mockBcrypt.compare.mockReset();
    mockBcrypt.hash.mockReset();
    mockJwt.sign.mockReset();
});

describe('auth.service', () => {
    
    describe('module initialization', () => {
        it('should throw fatal error if JWT_SECRET is missing', async () => {
            jest.resetModules();
            delete process.env.JWT_SECRET;
            
            // Re-mock dependencies for isolated import
            jest.unstable_mockModule('../../src/config/db.js', () => ({ default: poolMock }));
            jest.unstable_mockModule('bcrypt', () => ({ default: mockBcrypt }));
            jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
            
            await expect(import('../../src/services/auth.service.js'))
                .rejects
                .toThrow('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
                
            // Restore env for other tests
            process.env.JWT_SECRET = 'mock-secret-key';
        });
    });
    
    describe('loginUser', () => {
        it('should throw 400 for invalid input', async () => {
            await expect(loginUser(null, 'pass'))
                .rejects
                .toThrow(new AppError('Email and password are required', 400));
                
            await expect(loginUser('email@example.com', ''))
                .rejects
                .toThrow(new AppError('Email and password are required', 400));
                
            expect(poolMock.query).not.toHaveBeenCalled();
        });

        it('should login successfully with valid credentials (happy path)', async () => {
            const scenario = createMockUserScenario();
            const dbRow = createMockDbUserRow(scenario);
            
            // 1. Mock DB returning the user
            poolMock.query.mockResolvedValueOnce({ rows: [dbRow] });
            
            // 2. Mock bcrypt compare returning true
            mockBcrypt.compare.mockResolvedValueOnce(true);
            
            // 3. Mock jwt sign
            mockJwt.sign.mockReturnValueOnce('mock-jwt-token');
            
            const result = await loginUser(scenario.email, 'password123');
            
            // Validate Behavior Contract (Output Shape)
            expect(result).toEqual({
                token: 'mock-jwt-token',
                user: {
                    id: scenario.id,
                    email: scenario.email,
                    full_name: scenario.full_name,
                    student_id: scenario.student_id,
                    role: scenario.role
                }
            });
            
            // Validate Implementation limits (Query Count & Params)
            expect(poolMock.query).toHaveBeenCalledTimes(1);
            expect(poolMock.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT u.id, u.email'),
                [scenario.email]
            );
            expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', scenario.password_hash);
            expect(mockJwt.sign).toHaveBeenCalledWith(
                { id: scenario.id, role: scenario.role },
                'mock-secret-key',
                { expiresIn: '24h' }
            );
        });

        it('should throw 401 if email not found', async () => {
            // DB returns empty rows
            poolMock.query.mockResolvedValueOnce({ rows: [] });
            
            await expect(loginUser('notfound@example.com', 'pass'))
                .rejects
                .toThrow(new AppError('Invalid email or password', 401));
                
            expect(poolMock.query).toHaveBeenCalledTimes(1);
            expect(mockBcrypt.compare).not.toHaveBeenCalled(); // Should short-circuit
        });

        it('should throw 401 if password incorrect', async () => {
            const scenario = createMockUserScenario();
            const dbRow = createMockDbUserRow(scenario);
            
            poolMock.query.mockResolvedValueOnce({ rows: [dbRow] });
            mockBcrypt.compare.mockResolvedValueOnce(false); // Password mismatch
            
            await expect(loginUser(scenario.email, 'wrongpass'))
                .rejects
                .toThrow(new AppError('Invalid email or password', 401));
                
            expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);
            expect(mockJwt.sign).not.toHaveBeenCalled();
        });

        it('should throw 403 if user role is not assigned', async () => {
            const scenario = createMockUserScenario({ role: null }); // Missing role
            const dbRow = createMockDbUserRow(scenario);
            
            poolMock.query.mockResolvedValueOnce({ rows: [dbRow] });
            
            await expect(loginUser(scenario.email, 'pass'))
                .rejects
                .toThrow(new AppError('User role is not assigned', 403));
        });

        it('should handle unexpected DB shape gracefully', async () => {
            // DB returns null instead of an object, simulating driver/connection corruption
            poolMock.query.mockResolvedValueOnce(null);
            
            await expect(loginUser('test@example.com', 'pass'))
                .rejects
                .toThrow(TypeError);
        });

        it('should throw and not swallow error when DB crashes', async () => {
            poolMock.query.mockRejectedValueOnce(new Error('DB Crash'));
            
            await expect(loginUser('test@example.com', 'pass'))
                .rejects
                .toThrow('DB Crash');
        });
        
        it('should throw and not swallow error when bcrypt crashes', async () => {
            const scenario = createMockUserScenario();
            const dbRow = createMockDbUserRow(scenario);
            poolMock.query.mockResolvedValueOnce({ rows: [dbRow] });
            mockBcrypt.compare.mockRejectedValueOnce(new Error('bcrypt fail'));
            
            await expect(loginUser(scenario.email, 'pass'))
                .rejects
                .toThrow('bcrypt fail');
        });

        it('should throw and not swallow error when JWT sign fails', async () => {
            const scenario = createMockUserScenario();
            const dbRow = createMockDbUserRow(scenario);
            poolMock.query.mockResolvedValueOnce({ rows: [dbRow] });
            mockBcrypt.compare.mockResolvedValueOnce(true);
            mockJwt.sign.mockImplementation(() => {
                throw new Error('JWT fail');
            });
            
            await expect(loginUser(scenario.email, 'pass'))
                .rejects
                .toThrow('JWT fail');
        });
    });

    describe('registerUser', () => {
        it('should register successfully (happy path)', async () => {
            const scenario = createMockUserScenario();
            
            mockBcrypt.hash.mockResolvedValueOnce('hashed_pw');
            
            // Mock getStudentRoleId (SELECT query)
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: scenario.role_id }] });
            
            // Mock INSERT query
            poolMock.query.mockResolvedValueOnce({ 
                rows: [{ id: scenario.id, email: scenario.email, created_at: '2025-01-01' }] 
            });

            const result = await registerUser(scenario.full_name, scenario.email, 'password123');
            
            expect(result.id).toBe(scenario.id);
            expect(result.email).toBe(scenario.email);
            
            expect(poolMock.query).toHaveBeenCalledTimes(2);
            expect(poolMock.query).toHaveBeenNthCalledWith(1, 
                expect.stringContaining("SELECT id FROM roles")
            );
            expect(poolMock.query).toHaveBeenNthCalledWith(2, 
                expect.stringContaining("INSERT INTO users"), 
                [scenario.full_name, scenario.email, 'hashed_pw', scenario.role_id]
            );
        });

        it('should throw 400 if email already exists (unique violation)', async () => {
            mockBcrypt.hash.mockResolvedValueOnce('hashed_pw');
            
            // Mock getStudentRoleId
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 'role-1' }] });
            
            // Mock INSERT constraint violation
            const dbError = new Error('duplicate key');
            dbError.code = '23505';
            poolMock.query.mockRejectedValueOnce(dbError);

            await expect(registerUser('Name', 'dup@example.com', 'pass'))
                .rejects
                .toThrow(new AppError('Email already exists', 400));
        });

        it('should throw and not swallow error if INSERT fails for non-unique reason', async () => {
            mockBcrypt.hash.mockResolvedValueOnce('hashed_pw');
            
            // Mock getStudentRoleId
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 'role-1' }] });
            
            // Mock general INSERT fail
            poolMock.query.mockRejectedValueOnce(new Error('insert fail'));

            await expect(registerUser('Name', 'test@example.com', 'pass'))
                .rejects
                .toThrow('insert fail');
                
            expect(poolMock.query).toHaveBeenCalledTimes(2);
        });

        it('should throw 500 if STUDENT role is not found in DB', async () => {
            mockBcrypt.hash.mockResolvedValueOnce('hashed_pw');
            
            // Mock getStudentRoleId empty
            poolMock.query.mockResolvedValueOnce({ rows: [] });

            await expect(registerUser('Name', 'test@example.com', 'pass'))
                .rejects
                .toThrow(new AppError('Role STUDENT not found in database', 500));
                
            expect(poolMock.query).toHaveBeenCalledTimes(1); // Should not proceed to INSERT
        });
    });

    describe('getUserById', () => {
        it('should return user if found', async () => {
            const scenario = createMockUserScenario();
            const dbRow = createMockDbUserRow(scenario);
            
            poolMock.query.mockResolvedValueOnce({ rows: [dbRow] });
            
            const result = await getUserById(scenario.id);
            expect(result).toEqual(dbRow);
        });

        it('should throw 404 if user not found', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [] });
            
            await expect(getUserById('wrong-id'))
                .rejects
                .toThrow(new AppError('User not found', 404));
        });
    });

    describe('updateUserProfile', () => {
        it('should reject avatar_url without https:// protocol with 400 error', async () => {
            const error = await updateUserProfile('user-1', { avatar_url: 'http://insecure.com/pic.png' }).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(400);
            expect(error.message).toContain('https://');
        });

        it('should ignore non-whitelisted fields (email, role, student_id) and update profile successfully', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 'user-1' }] }); // UPDATE
            poolMock.query.mockResolvedValueOnce({
                rows: [{
                    id: 'user-1',
                    email: 'user@example.com',
                    full_name: 'New Name',
                    student_id: 'SV123',
                    avatar_url: 'https://example.com/avatar.jpg',
                    role: 'STUDENT'
                }]
            }); // getUserById

            const result = await updateUserProfile('user-1', {
                full_name: 'New Name',
                avatar_url: 'https://example.com/avatar.jpg',
                email: 'hacked@example.com',
                role: 'ADMIN',
                student_id: 'HACKED'
            });

            expect(result.full_name).toBe('New Name');
            expect(result.email).toBe('user@example.com');
            expect(result.role).toBe('STUDENT');
        });
    });

    describe('changeUserPassword', () => {
        it('should throw 401 Unauthorized if current password is incorrect', async () => {
            poolMock.query.mockResolvedValueOnce({
                rows: [{ id: 'user-1', password_hash: 'hashed_current' }]
            });
            mockBcrypt.compare.mockResolvedValueOnce(false); // Password wrong

            const error = await changeUserPassword('user-1', 'wrong_current', 'newPassword123').catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Mật khẩu hiện tại không đúng');
        });

        it('should update password and succeed when current password is correct', async () => {
            poolMock.query.mockResolvedValueOnce({
                rows: [{ id: 'user-1', password_hash: 'hashed_current' }]
            });
            mockBcrypt.compare.mockResolvedValueOnce(true); // Password correct
            mockBcrypt.hash.mockResolvedValueOnce('hashed_new');
            poolMock.query.mockResolvedValueOnce({ rowCount: 1 }); // UPDATE password

            const result = await changeUserPassword('user-1', 'correct_current', 'newPassword123');

            expect(result.message).toBe('Password updated successfully');
            expect(mockBcrypt.compare).toHaveBeenCalledWith('correct_current', 'hashed_current');
            expect(mockBcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
        });
    });
});

