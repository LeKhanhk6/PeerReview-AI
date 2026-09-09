import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

router.use(verifyToken);
// Bỏ authorizeRoles global để route GET cho Student vào được
const teacherOnly = authorizeRoles('TEACHER', 'ADMIN');

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

router.get('/dashboard/overview', teacherOnly, validate(classIdQuerySchema), analyticsController.getDashboardOverview);

// Group Contribution (detail)
router.get('/groups/:groupId/contribution', teacherOnly, validate(groupIdParamSchema), analyticsController.getGroupContribution);

// Class Contributions Overview (list of groups)
router.get('/classes/:classId/contributions', teacherOnly, validate(classIdParamSchema), analyticsController.getClassContributions);

// Assignment Review Analytics (Core API)
router.get('/assignments/:assignmentId/reviews', teacherOnly, validate(assignmentIdParamSchema), analyticsController.getAssignmentReviewAnalytics);

// Class Review Analytics (Aggregation API)
router.get('/classes/:classId/reviews', teacherOnly, validate(classIdParamSchema), analyticsController.getClassReviewAnalytics);

// Collaboration Risks / Early Warning
router.get('/classes/:classId/collaboration-risks', teacherOnly, validate(classIdParamSchema), analyticsController.getClassCollaborationRisks);

// --- TÍNH NĂNG CHẤM NỘI BỘ (TASK 5) ---
const groupAnalyticsSchema = {
    params: z.object({
        assignmentId: idSchema,
        groupId: idSchema
    })
};

// GET lấy snapshot (Student & Teacher) hoặc tính live (Teacher)
router.get('/assignments/:assignmentId/groups/:groupId/analytics', validate(groupAnalyticsSchema), analyticsController.getAssignmentGroupAnalytics);

// POST chốt snapshot (Chỉ Teacher)
router.post('/assignments/:assignmentId/groups/:groupId/analytics/publish', teacherOnly, validate(groupAnalyticsSchema), analyticsController.publishGroupAnalytics);

export default router;
