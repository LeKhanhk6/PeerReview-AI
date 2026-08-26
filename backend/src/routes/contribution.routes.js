import express from 'express';
import { z } from 'zod';
import * as contributionController from '../controllers/contribution.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

const getReportSchema = {
    params: z.object({
        groupId: z.string().uuid()
    }),
    query: z.object({
        from: z.string().datetime(),
        to: z.string().datetime()
    })
};

// GET /api/groups/:groupId/contributions
router.get('/:groupId/contributions', verifyToken, validate(getReportSchema), contributionController.getGroupContributionReport);

export default router;
