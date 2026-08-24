import express from 'express';
import { z } from 'zod';
import * as reviewAssignmentController from '../controllers/review-assignment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

router.use(authenticate);

const uuidSchema = z.string().uuid();
const generateSchema = {
    params: z.object({ assignmentId: uuidSchema }),
    body: z.object({
        reviewsPerGroup: z.coerce.number().int().min(1).max(10).optional()
    })
};

// Teacher: Generate double-blind peer review assignments
router.post('/assignments/:assignmentId/review-assignments/generate', authorize('TEACHER', 'ADMIN'), validate(generateSchema), reviewAssignmentController.generateReviewAssignments);

export default router;
