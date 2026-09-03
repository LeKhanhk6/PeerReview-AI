import express from 'express';
import { z } from 'zod';
import * as reviewController from '../controllers/review.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';
import { dynamicAiRateLimiter } from '../middleware/ai-rate-limit.middleware.js';

const router = express.Router();

router.use(verifyToken);

// ==========================================
// SCHEMAS
// ==========================================
const uuidSchema = z.string().uuid();
const assignmentIdParamSchema = z.object({ assignmentId: uuidSchema });
const reviewAssignmentIdParamSchema = z.object({ reviewAssignmentId: uuidSchema });

const submitReviewSchema = {
    params: reviewAssignmentIdParamSchema,
    body: z.object({
        overallComment: z.string().min(1).max(2000).trim(),
        criteriaScores: z.array(z.object({
            criteriaId: uuidSchema,
            score: z.coerce.number().min(0).max(100)
        })).max(50).refine((items) => {
            const ids = items.map(i => i.criteriaId);
            return new Set(ids).size === ids.length;
        }, { message: "Duplicate criteriaId found" })
    })
};

const analyzeReviewSchema = {
    body: z.object({
        comment: z.string().min(15).max(2000).trim().transform(val => val.replace(/<[^>]*>?/gm, ''))
    })
};

const synthesisQuerySchema = {
    params: assignmentIdParamSchema,
    query: z.object({
        from: z.string().optional(),
        to: z.string().optional()
    })
};

// Student: Get ALL assignments they are supposed to review (across all assignments)
router.get('/my-reviews', authorizeRoles('STUDENT'), paginationMiddleware, reviewController.getMyReviewAssignments);

// Student: Get assignments they are supposed to review (Double-blind mapped)
router.get('/assignments/:assignmentId/my-reviews', authorizeRoles('STUDENT'), validate({ params: assignmentIdParamSchema }), paginationMiddleware, reviewController.getMyReviewAssignments);

// Student: Get detail of a specific review assignment (for grading screen)
router.get('/my-reviews/:reviewAssignmentId', authorizeRoles('STUDENT'), validate({ params: reviewAssignmentIdParamSchema }), reviewController.getReviewAssignmentDetail);

// Student: Submit a peer review
router.post('/my-reviews/:reviewAssignmentId/submit', authorizeRoles('STUDENT'), validate(submitReviewSchema), reviewController.submitReviewAssignment);

// Student: Analyze review comment with AI (with dynamic rate limiting based on system_config)
router.post('/analyze', authorizeRoles('STUDENT'), dynamicAiRateLimiter, validate(analyzeReviewSchema), reviewController.analyzeReviewText);
router.post('/reviews/analyze', authorizeRoles('STUDENT'), dynamicAiRateLimiter, validate(analyzeReviewSchema), reviewController.analyzeReviewText);


// Teacher/Admin: Generate AI Synthesis of all reviews for an assignment
router.get('/assignments/:assignmentId/reviews/synthesis', authorizeRoles('TEACHER', 'ADMIN'), validate(synthesisQuerySchema), reviewController.generateAssignmentReviewSynthesis);

export default router;
