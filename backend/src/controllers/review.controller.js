import * as reviewService from '../services/review.service.js';
import { isValidUUID } from '../utils/validation.util.js';

export const getMyReviewAssignments = async (req, res, next) => {
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

        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;
        
        if (page < 1 || limit < 1) {
            const error = new Error('Invalid pagination parameters');
            error.statusCode = 400;
            return next(error);
        }

        // Clamp values to prevent DB stress
        limit = Math.min(limit, 50);
        page = Math.min(page, 1000);

        const offset = (page - 1) * limit;

        const { rows, total } = await reviewService.getMyReviewAssignments(
            assignmentId,
            userId,
            limit,
            offset
        );

        const hasNext = offset + limit < total;

        return res.status(200).json({
            data: rows,
            page,
            limit,
            hasNext,
            total
        });
    } catch (error) {
        next(error);
    }
};

export const getReviewAssignmentDetail = async (req, res, next) => {
    const { reviewAssignmentId } = req.params;
    const userId = req.user?.id;
    
    console.time(`review_detail:${reviewAssignmentId}:user:${userId}`);

    try {
        if (!userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 401;
            return next(error);
        }

        if (!isValidUUID(reviewAssignmentId)) {
            const error = new Error('Invalid review assignment ID format');
            error.statusCode = 400;
            return next(error);
        }

        const detail = await reviewService.getReviewAssignmentDetail(reviewAssignmentId, userId);

        return res.status(200).json({
            data: detail
        });
    } catch (error) {
        next(error);
    } finally {
        console.timeEnd(`review_detail:${reviewAssignmentId}:user:${userId}`);
    }
};
