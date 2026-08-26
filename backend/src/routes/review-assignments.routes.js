import express from 'express';
import { z } from 'zod';
import * as reviewAssignmentController from '../controllers/review-assignment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

router.use(verifyToken);

const uuidSchema = z.string().uuid();
const generateSchema = {
    params: z.object({ assignmentId: uuidSchema }),
    body: z.object({
        reviewsPerGroup: z.coerce.number().int().min(1).max(10).optional()
    })
};

// Teacher: Generate double-blind peer review assignments
router.post('/assignments/:assignmentId/review-assignments/generate', authorizeRoles('TEACHER', 'ADMIN'), validate(generateSchema), reviewAssignmentController.generateReviewAssignments);

export default router;
