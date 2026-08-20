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
