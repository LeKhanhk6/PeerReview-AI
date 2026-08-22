import * as summaryService from '../services/summary.service.js';
import AppError from '../utils/AppError.js';

export const getSourceReviews = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

        const result = await summaryService.getSourceReviews(req.user, submissionId, page, limit);
        
        const total = result.total;
        const hasNext = (page * limit) < total;
        
        res.json({
            data: result.reviews,
            pagination: {
                page,
                limit,
                total,
                hasNext
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getReviewSummary = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const result = await summaryService.getReviewSummary(req.user, submissionId);
        res.json({ data: result });
    } catch (error) {
        next(error);
    }
};

export const updateSummaryItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { content, note, updatedAt } = req.body;
        
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new AppError('Request body cannot be empty', 400);
        }

        if (content !== undefined) {
            if (typeof content !== 'string' || content.trim() === '') {
                throw new AppError('Content cannot be empty', 400);
            }
            if (content.length > 2000) {
                throw new AppError('Content is too long (max 2000 chars)', 400);
            }
        }

        if (note !== undefined) {
            if (typeof note !== 'string') {
                throw new AppError('Note must be a string', 400);
            }
            if (note.length > 1000) {
                throw new AppError('Note is too long (max 1000 chars)', 400);
            }
        }
        
        if (!updatedAt || isNaN(Date.parse(updatedAt))) {
            throw new AppError('Invalid updatedAt timestamp format', 400);
        }
        
        const allowedFields = ['content', 'note', 'updatedAt'];
        const updates = {};
        for (const key of Object.keys(req.body)) {
            if (!allowedFields.includes(key)) {
                throw new AppError(`Field '${key}' is not allowed`, 400);
            }
            updates[key] = req.body[key];
        }

        const result = await summaryService.updateSummaryItem(req.user, itemId, updates);
        res.json({ data: result });
    } catch (error) {
        next(error);
    }
};

export const approveReviewSummary = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const result = await summaryService.approveReviewSummary(req.user, submissionId);
        res.json({ data: result });
    } catch (error) {
        next(error);
    }
};
