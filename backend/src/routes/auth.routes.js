import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, getMe } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

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

router.post('/login', loginLimiter, login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);

export default router;
