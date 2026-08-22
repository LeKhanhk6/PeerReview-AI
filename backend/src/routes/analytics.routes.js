import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('TEACHER', 'ADMIN'));

router.get('/dashboard/overview', analyticsController.getDashboardOverview);

// Group Contribution (detail)
router.get('/groups/:groupId/contribution', analyticsController.getGroupContribution);

// Class Contributions Overview (list of groups)
router.get('/classes/:classId/contributions', analyticsController.getClassContributions);

export default router;
