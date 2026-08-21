import * as reviewAssignmentService from '../services/review-assignment.service.js';
import { isValidUUID } from '../utils/validation.util.js';

export const generateReviewAssignments = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 401;
            return next(error);
        }

        if (!isValidUUID(assignmentId)) {
            const error = new Error('Invalid assignment ID format');
            error.statusCode = 400;
            return next(error);
        }

        // Optionally allow teacher to specify custom reviews_per_group via body or query
        const { reviewsPerGroup } = req.body;
        
        let parsedReviews = undefined;
        if (reviewsPerGroup !== undefined) {
            parsedReviews = parseInt(reviewsPerGroup, 10);
            if (!Number.isInteger(parsedReviews) || parsedReviews < 1) {
                const error = new Error('Invalid reviewsPerGroup value');
                error.statusCode = 400;
                return next(error);
            }
            parsedReviews = Math.min(parsedReviews, 10); // Clamp maximum to 10
        }

        const summary = await reviewAssignmentService.generateReviewAssignments(
            assignmentId,
            userId,
            parsedReviews
        );

        return res.status(200).json({ data: summary });
    } catch (error) {
        next(error);
    }
};
