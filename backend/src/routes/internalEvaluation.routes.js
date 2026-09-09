import express from 'express';
import { submitEvaluation, getMyEvaluations } from '../controllers/internalEvaluation.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/assignments/:assignmentId/groups/:groupId/internal-evaluations', authenticateToken, submitEvaluation);
router.get('/assignments/:assignmentId/groups/:groupId/internal-evaluations', authenticateToken, getMyEvaluations);

export default router;
