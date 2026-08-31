import * as authService from '../services/auth.service.js';
import * as passwordResetService from '../services/password-reset.service.js';
import { AppError } from '../utils/AppError.js';

export const register = async (req, res, next) => {
    try {
        const { full_name, email, password, student_id } = req.body;

        const user = await authService.registerUser(full_name, email, password, student_id);

        console.info('User registered', { email: user.email, userId: user.id });

        return res.ok({
            user: {
                id: user.id,
                email: user.email,
                student_id: user.student_id,
                role: user.role,
                created_at: user.created_at
            }
        }, 201);
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        const data = await authService.loginUser(email, password);
        
        // Set HTTP-only cookie
        res.cookie('token', data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return res.ok({
            user: data.user,
            accessToken: data.token
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        res.clearCookie('token');
        return res.ok(null);
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        const userId = req.user?.id; 
        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        
        const user = await authService.getUserById(userId);
        const auditEnabled = process.env.AUDIT_ENABLED === 'true';

        return res.ok({ 
            user: {
                ...user,
                capabilities: {
                    audit_enabled: auditEnabled
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await passwordResetService.requestPasswordReset(email);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const result = await passwordResetService.resetPassword(token, password);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const user = await authService.updateUserProfile(userId, req.body);
        return res.ok({ user });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const { current_password, new_password } = req.body;
        const result = await authService.changeUserPassword(userId, current_password, new_password);
        
        // Clear cookie upon password change to invalidate current session
        res.clearCookie('token');
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};


