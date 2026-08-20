import express from 'express';
import * as submissionController from '../controllers/submission.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Student Dashboard API
router.get('/me/dashboard', authorize('STUDENT'), submissionController.getStudentDashboard);

// Submit Assignment API
router.post('/assignments/:assignmentId', authorize('STUDENT'), submissionController.submit);

export default router;
