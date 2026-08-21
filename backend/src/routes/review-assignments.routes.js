import express from 'express';
import * as reviewAssignmentController from '../controllers/review-assignment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Teacher: Generate double-blind peer review assignments
router.post('/assignments/:assignmentId/review-assignments/generate', authorize('TEACHER'), reviewAssignmentController.generateReviewAssignments);

export default router;
