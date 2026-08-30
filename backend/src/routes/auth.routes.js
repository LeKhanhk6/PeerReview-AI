import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { login, logout, getMe, register, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// Rate Limiter cho Login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5,
    message: { message: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiter cho Quên mật khẩu (chống email enumeration & spam)
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 5, // Tối đa 5 lần yêu cầu trong 1 giờ per IP
    message: { message: 'Too many password reset requests, please try again after 1 hour' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerSchema = {
    body: z.object({
        full_name: z.string().min(2).max(255).trim(),
        email: z.string().email().trim().toLowerCase(),
        password: z.string().min(6).trim()
    })
};

const loginSchema = {
    body: z.object({
        email: z.string().email().trim().toLowerCase(),
        password: z.string().min(1).trim()
    })
};

const forgotPasswordSchema = {
    body: z.object({
        email: z.string().email().trim().toLowerCase(),
    })
};

const resetPasswordSchema = {
    body: z.object({
        token: z.string().min(10).trim(),
        password: z.string().min(6).trim(),
    })
};

router.post('/register', validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);

export default router;

