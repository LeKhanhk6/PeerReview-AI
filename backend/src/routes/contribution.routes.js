import express from 'express';
import * as contributionController from '../controllers/contribution.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/groups/:groupId/contributions
router.get('/:groupId/contributions', requireAuth, contributionController.getGroupContributionReport);

export default router;
