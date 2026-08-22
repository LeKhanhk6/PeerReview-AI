import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('TEACHER', 'ADMIN'));

// ?classId=xxx&from=xxx&to=xxx
router.get('/dashboard/overview', analyticsController.getDashboardOverview);

export default router;
