import express from 'express';
import { submitEvaluation, getMyEvaluations } from '../controllers/internalEvaluation.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/assignments/:assignmentId/groups/:groupId/internal-evaluations', verifyToken, submitEvaluation);
router.get('/assignments/:assignmentId/groups/:groupId/internal-evaluations', verifyToken, getMyEvaluations);

export default router;
