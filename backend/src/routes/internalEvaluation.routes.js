import express from 'express';
import { submitEvaluation, getMyEvaluations } from '../controllers/internalEvaluation.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

import { validate } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const router = express.Router();

const internalEvaluationSchema = {
    body: z.object({
        evaluateeId: z.string().trim().min(1),
        c2_score: z.number().min(1).max(5),
        c3_score: z.number().min(1).max(5),
        c4_score: z.number().min(1).max(5)
    })
};

router.post('/assignments/:assignmentId/groups/:groupId/internal-evaluations', verifyToken, validate(internalEvaluationSchema), submitEvaluation);
router.get('/assignments/:assignmentId/groups/:groupId/internal-evaluations', verifyToken, getMyEvaluations);

export default router;
