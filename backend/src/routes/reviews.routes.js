import express from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Student: Get assignments they are supposed to review (Double-blind mapped)
router.get('/assignments/:assignmentId/my-reviews', authorize('STUDENT'), reviewController.getMyReviewAssignments);

// Student: Get detail of a specific review assignment (for grading screen)
router.get('/my-reviews/:reviewAssignmentId', authorize('STUDENT'), reviewController.getReviewAssignmentDetail);

// Student: Submit a peer review
router.post('/my-reviews/:reviewAssignmentId/submit', authorize('STUDENT'), reviewController.submitReviewAssignment);

// Student: Analyze review comment with AI
router.post('/analyze', authorize('STUDENT'), reviewController.analyzeReviewText);

export default router;
