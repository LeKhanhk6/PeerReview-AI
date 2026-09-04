import * as summaryService from '../services/summary.service.js';
import { AppError } from '../utils/AppError.js';

export const getSourceReviews = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const page = req.pagination.page;
        const limit = req.pagination.limit;

        const result = await summaryService.getSourceReviews(req.user, submissionId, page, limit);
        
        return res.paginate(result.reviews, { page, limit, total: result.total });
    } catch (error) {
        next(error);
    }
};

export const getReviewSummary = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const result = await summaryService.getReviewSummary(req.user, submissionId);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

export const updateSummaryItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { content, note, updatedAt } = req.body;
        
        const result = await summaryService.updateSummaryItem(req.user, itemId, { content, note, updatedAt });
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

export const deleteSummaryItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const result = await summaryService.deleteSummaryItem(req.user, itemId);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

export const approveReviewSummary = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const result = await summaryService.approveReviewSummary(req.user, submissionId);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

export const getSummaryStatus = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const result = await summaryService.getSummaryStatus(req.user, submissionId);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

export const generateSubmissionSummary = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const result = await summaryService.generateSubmissionSummary(req.user, submissionId);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

