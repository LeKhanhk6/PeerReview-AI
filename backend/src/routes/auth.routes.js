import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { login, logout, getMe, register } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// CẢI THIỆN 3: Cấu hình Rate Limiter để chống Brute-Force
// Chỉ cho phép tối đa 5 lần thử đăng nhập sai trong vòng 15 phút từ cùng 1 IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5,
    message: { message: 'Too many login attempts, please try again after 15 minutes' },
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
        password: z.string().min(1).trim() // must not be empty
    })
};

router.post('/register', validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);

export default router;
