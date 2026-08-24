import * as reviewAssignmentService from '../services/review-assignment.service.js';
import { isValidUUID } from '../utils/validation.util.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
import crypto from 'crypto';

export const generateReviewAssignments = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user?.id;
        const { reviewsPerGroup } = req.body; // already validated by Zod

        // Use a generic request ID if not provided by middleware (for trace backbone)
        const requestId = req.requestId || crypto.randomUUID();
        
        logger.info({ event: 'generateReviewAssignments_start', requestId, assignmentId, userId, reviewsPerGroup });

        const summary = await reviewAssignmentService.generateReviewAssignments(
            assignmentId,
            userId,
            reviewsPerGroup
        );

        logger.info({ event: 'generateReviewAssignments_success', requestId, assignmentId, total: summary.totalAssignments });

        return res.ok(summary);
    } catch (error) {
        next(error);
    }
};
