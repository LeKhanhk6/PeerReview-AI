import express from 'express';
import { login, logout, getMe } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);

export default router;
