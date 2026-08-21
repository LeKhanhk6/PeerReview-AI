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

export const submitReviewAssignment = async (req, res, next) => {
    const { reviewAssignmentId } = req.params;
    const userId = req.user?.id;
    
    console.time(`submit_review:${reviewAssignmentId}:user:${userId}`);
    try {
        const { overallComment, criteriaScores } = req.body;

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

        // Payload validations (Cheap fail-fast)
        const comment = typeof overallComment === 'string' ? overallComment.trim() : null;
        if (!comment || comment.length === 0) {
            const error = new Error('overallComment is required');
            error.statusCode = 400;
            return next(error);
        }

        if (comment.length > 2000) {
            const error = new Error('overallComment exceeds maximum length of 2000 characters');
            error.statusCode = 400;
            return next(error);
        }

        if (!Array.isArray(criteriaScores) || criteriaScores.length === 0) {
            const error = new Error('criteriaScores array is required');
            error.statusCode = 400;
            return next(error);
        }

        if (criteriaScores.length > 50) {
            const error = new Error('Too many criteria scores');
            error.statusCode = 400;
            return next(error);
        }

        const uniqueIds = new Set();
        for (const item of criteriaScores) {
            if (!isValidUUID(item.criteriaId)) {
                const error = new Error(`Invalid criteriaId format: ${item.criteriaId}`);
                error.statusCode = 400;
                return next(error);
            }
            if (uniqueIds.has(item.criteriaId)) {
                const error = new Error(`Duplicate criteriaId found: ${item.criteriaId}`);
                error.statusCode = 400;
                return next(error);
            }
            uniqueIds.add(item.criteriaId);
            
            const score = parseFloat(item.score);
            if (isNaN(score) || score < 0 || score > 100) {
                const error = new Error(`Invalid score for criteria ${item.criteriaId}. Must be between 0 and 100.`);
                error.statusCode = 400;
                return next(error);
            }
        }

        const result = await reviewService.submitReview(reviewAssignmentId, userId, { overallComment: comment, criteriaScores });

        return res.status(200).json({
            data: result
        });
    } catch (error) {
        next(error);
    } finally {
        console.timeEnd(`submit_review:${reviewAssignmentId}:user:${userId}`);
    }
};
