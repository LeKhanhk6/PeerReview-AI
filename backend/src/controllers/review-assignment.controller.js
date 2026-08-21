import * as reviewAssignmentService from '../services/review-assignment.service.js';
import { isValidUUID } from '../utils/validation.util.js';

export const generateReviewAssignments = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!isValidUUID(assignmentId)) {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }

        // Optionally allow teacher to specify custom reviews_per_group via body or query
        const { reviewsPerGroup } = req.body;
        
        let parsedReviews = undefined;
        if (reviewsPerGroup !== undefined) {
            parsedReviews = parseInt(reviewsPerGroup, 10);
            if (!Number.isInteger(parsedReviews) || parsedReviews < 1) {
                return res.status(400).json({ message: 'Invalid reviewsPerGroup value' });
            }
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
