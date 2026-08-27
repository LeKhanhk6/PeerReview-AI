import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(authorizeRoles('TEACHER', 'ADMIN'));

// Schemas
const idSchema = z.string().trim().min(1);

const classIdQuerySchema = {
    query: z.object({
        classId: idSchema.optional()
    })
};

const groupIdParamSchema = { params: z.object({ groupId: idSchema }) };
const classIdParamSchema = { params: z.object({ classId: idSchema }) };
const assignmentIdParamSchema = { params: z.object({ assignmentId: idSchema }) };

router.get('/dashboard/overview', validate(classIdQuerySchema), analyticsController.getDashboardOverview);

// Group Contribution (detail)
router.get('/groups/:groupId/contribution', validate(groupIdParamSchema), analyticsController.getGroupContribution);

// Class Contributions Overview (list of groups)
router.get('/classes/:classId/contributions', validate(classIdParamSchema), analyticsController.getClassContributions);

// Assignment Review Analytics (Core API)
router.get('/assignments/:assignmentId/reviews', validate(assignmentIdParamSchema), analyticsController.getAssignmentReviewAnalytics);

// Class Review Analytics (Aggregation API)
router.get('/classes/:classId/reviews', validate(classIdParamSchema), analyticsController.getClassReviewAnalytics);

// Collaboration Risks / Early Warning
router.get('/classes/:classId/collaboration-risks', validate(classIdParamSchema), analyticsController.getClassCollaborationRisks);

export default router;
