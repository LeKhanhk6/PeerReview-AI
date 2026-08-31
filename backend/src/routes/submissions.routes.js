import express from 'express';
import { z } from 'zod';
import * as submissionController from '../controllers/submission.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';

const router = express.Router();

router.use(verifyToken);

const uuidSchema = z.string().uuid();
const assignmentIdParamSchema = z.object({ assignmentId: uuidSchema });

const submitSchema = {
    params: assignmentIdParamSchema,
    body: z.object({
        file_url: z.string().url().refine(val => {
            const allowedDomains = ['s3.amazonaws.com', 'firebaseapp.com', 'googleapis.com'];
            try {
                const hostname = new URL(val).hostname;
                return allowedDomains.some(d => hostname.endsWith(d));
            } catch {
                return false;
            }
        }, { message: "file_url domain is not allowed" })
    })
};

const dashboardQuerySchema = {
    query: z.object({
        sort: z.string().optional()
    })
};

// Student Dashboard API
router.get('/me/dashboard', authorizeRoles('STUDENT'), validate(dashboardQuerySchema), paginationMiddleware, submissionController.getStudentDashboard);

// Submit Assignment API
router.post('/assignments/:assignmentId', authorizeRoles('STUDENT'), validate(submitSchema), submissionController.submit);

// Submission History API
router.get('/assignments/:assignmentId/submission-history', authorizeRoles('STUDENT'), validate({ params: assignmentIdParamSchema }), paginationMiddleware, submissionController.getSubmissionHistoryByAssignment);

// Student Feedback API
router.get('/assignments/:assignmentId/feedback', authorizeRoles('STUDENT'), validate({ params: assignmentIdParamSchema }), submissionController.getSubmissionFeedback);

// Teacher Submissions Monitor API
router.get('/assignments/:assignmentId/monitor', authorizeRoles('TEACHER', 'ADMIN'), validate({ params: assignmentIdParamSchema }), submissionController.getTeacherSubmissionsMonitor);

export default router;
