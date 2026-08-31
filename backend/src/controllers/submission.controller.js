import * as submissionService from '../services/submission.service.js';
import { AppError } from '../utils/AppError.js';

export const getStudentDashboard = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        let { sort = 'deadline' } = req.query;
        const { limit, offset, page } = req.pagination;

        // Sort whitelist + DESC
        const allowedSort = {
            deadline: 'deadline',
            created_at: 'assignment_created_at'
        };

        const isDesc = sort?.startsWith('-');
        const field = sort?.replace(/^-+/, '');

        const sortColumn = allowedSort[field] || 'deadline';
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

export const submit = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const { file_url } = req.body;
        const userId = req.user?.id;

        const result = await submissionService.submitAssignment(assignmentId, userId, file_url);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

export const getSubmissionHistoryByAssignment = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user?.id;
        const { limit, offset, page } = req.pagination;

        const { rows, total } = await submissionService.getSubmissionHistoryByAssignment(
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

export const getSubmissionFeedback = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.user?.id;

        const feedback = await submissionService.getSubmissionFeedback(assignmentId, userId);
        return res.ok(feedback);
    } catch (error) {
        next(error);
    }
};

export const getTeacherSubmissionsMonitor = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const { status = 'ALL' } = req.query;
        const currentUser = req.user;

        const result = await submissionService.getTeacherSubmissionsMonitor(
            assignmentId,
            currentUser,
            status
        );
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

