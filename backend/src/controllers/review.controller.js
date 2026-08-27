import crypto from 'crypto';
import * as reviewService from '../services/review.service.js';
import * as aiService from '../services/ai.service.js';
import * as assignmentService from '../services/assignment.service.js';
import { isValidUUID } from '../utils/validation.util.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';

export const getMyReviewAssignments = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user?.id;
        const { limit, offset, page } = req.pagination;

        const { rows, total } = await reviewService.getMyReviewAssignments(
            assignmentId,
            userId,
            limit,
            offset
        );

        const hasNext = offset + limit < total;

        return res.paginate(rows, {
            page,
            limit,
            hasNext,
            total
        });
    } catch (error) {
        next(error);
    }
};

export const generateAssignmentReviewSynthesis = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;

        const userId = req.user?.id;
        const { from, to } = req.query;

        // Validate Teacher Ownership
        const ownership = await assignmentService.getAssignmentOwnershipInfo(assignmentId);
        if (!ownership) {
            throw new AppError('Assignment not found', 404, 'NOT_FOUND');
        }
        if (req.user.role === 'TEACHER' && ownership.teacher_id !== userId) {
            throw new AppError('Forbidden: You do not own this assignment', 403, 'FORBIDDEN');
        }

        const requestId = crypto.randomUUID();
        const timeframe = (from || to) ? { from, to } : undefined;
        const timeframeKey = `${from || 'all'}_${to || 'all'}`;

        logger.info({ event: 'review.synthesis.start', requestId, assignmentId, timeframeKey });

        const { reviewsText, totalReviews, reviewsUsed } = await reviewService.getAssignmentReviewsForSynthesis(assignmentId, timeframe);
        
        if (totalReviews < 5) {
            return res.ok({
                requestId,
                summary: "Chưa có đủ dữ liệu để phân tích.",
                reason: "NOT_ENOUGH_REVIEWS",
                strengths: [],
                weaknesses: [],
                suggestions: [],
                totalReviews,
                reviewsUsed: 0,
                confidence: 0
            });
        }

        // Controller-level timeout guard (20s) with explicit timer cleanup
        let timerId;
        const timeoutPromise = new Promise((_, reject) => {
            timerId = setTimeout(() => reject(new AppError('AI Synthesis Request Timeout', 504, 'TIMEOUT')), 20000);
        });

        try {
            const synthesis = await Promise.race([
                aiService.synthesizeReviews(assignmentId, timeframeKey, reviewsText, totalReviews, reviewsUsed, requestId),
                timeoutPromise
            ]);

            return res.ok({
                requestId,
                ...synthesis
            });
        } finally {
            clearTimeout(timerId);
        }
    } catch (error) {
        next(error);
    }
};

export const getReviewAssignmentDetail = async (req, res, next) => {
    const { reviewAssignmentId } = req.params;
    const userId = req.user?.id;
    
    logger.info({ event: 'review_detail_start', reviewAssignmentId, userId });

    try {
        const detail = await reviewService.getReviewAssignmentDetail(reviewAssignmentId, userId);

        return res.ok(detail);
    } catch (error) {
        next(error);
    } finally {
        logger.info({ event: 'review_detail_end', reviewAssignmentId, userId });
    }
};

export const submitReviewAssignment = async (req, res, next) => {
    const { reviewAssignmentId } = req.params;
    const userId = req.user?.id;
    
    logger.info({ event: 'submit_review_start', reviewAssignmentId, userId });
    try {
        const { overallComment, criteriaScores } = req.body;

        const result = await reviewService.submitReview(reviewAssignmentId, userId, { overallComment, criteriaScores });

        return res.ok(result);
    } catch (error) {
        next(error);
    } finally {
        logger.info({ event: 'submit_review_end', reviewAssignmentId, userId });
    }
};

export const analyzeReviewText = async (req, res, next) => {
    try {
        const { comment } = req.body;
        
        const requestId = crypto.randomUUID();

        // Call AI Service
        const result = await aiService.analyzeComment(comment, requestId); // the schema already sanitized it
        
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};
