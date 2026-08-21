import * as submissionService from '../services/submission.service.js';

export const getStudentDashboard = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        let { page = 1, limit = 20, sort = 'deadline' } = req.query;

        // Pagination fallback
        const parsedLimit = parseInt(limit, 10);
        limit = Number.isInteger(parsedLimit) ? parsedLimit : 20;
        limit = Math.min(limit, 50);

        const parsedPage = parseInt(page, 10);
        page = Number.isInteger(parsedPage) ? parsedPage : 1;
        page = Math.min(page, 1000);

        const offset = (page - 1) * limit;

        // Sort whitelist + DESC
        const allowedSort = {
            deadline: 'a.deadline',
            created_at: 'a.created_at'
        };

        const isDesc = sort?.startsWith('-');
        const field = sort?.replace('-', '');

        const sortColumn = allowedSort[field] || 'a.deadline';
        const sortOrder = isDesc ? 'DESC' : 'ASC';

        const { rows, total } = await submissionService.getStudentDashboardData(
            userId,
            limit,
            offset,
            sortColumn,
            sortOrder
        );

        // heuristic / direct check
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

import { isValidUUID, isValidHttpUrl } from '../utils/validation.util.js';

export const submit = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const { file_url } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!isValidUUID(assignmentId)) {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }

        if (!file_url || !isValidHttpUrl(file_url)) {
            return res.status(400).json({ message: 'A valid file_url is required' });
        }

        const allowedDomains = ['s3.amazonaws.com', 'firebaseapp.com', 'googleapis.com'];
        if (!allowedDomains.some(d => file_url.includes(d))) {
            return res.status(400).json({ message: 'file_url domain is not allowed' });
        }

        const result = await submissionService.submitAssignment(assignmentId, userId, file_url);
        return res.status(200).json({ data: result });
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};

export const getSubmissionHistoryByAssignment = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!isValidUUID(assignmentId)) {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }

        let { page = 1, limit = 10 } = req.query;
        
        const parsedLimit = parseInt(limit, 10);
        limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
        limit = Math.min(limit, 50);

        const parsedPage = parseInt(page, 10);
        page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        
        const offset = (page - 1) * limit;

        const { rows, total } = await submissionService.getSubmissionHistoryByAssignment(
            assignmentId,
            userId,
            limit,
            offset
        );

        if (total === 0) {
            return res.status(200).json({
                data: [],
                message: 'No submission yet',
                page,
                limit,
                hasNext: false,
                total: 0
            });
        }

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

