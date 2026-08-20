import { Router } from 'express';
import { getActivities } from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Lấy activity logs của một group
router.get('/:id/activities', authenticate, getActivities);

export default router;
