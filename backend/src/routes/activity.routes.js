import { Router } from 'express';
import { getActivities } from '../controllers/activity.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Lấy activity logs của một group
router.get('/groups/:id/activities', verifyToken, getActivities);

export default router;
