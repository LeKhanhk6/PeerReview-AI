import express from 'express';
import { login, logout, getMe, adminOnly, staffOnly } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);

// FOR TESTING RBAC ONLY
router.get('/admin-only', verifyToken, authorizeRoles('ADMIN'), adminOnly);
router.get('/staff-only', verifyToken, authorizeRoles('ADMIN', 'TEACHER'), staffOnly);

export default router;
