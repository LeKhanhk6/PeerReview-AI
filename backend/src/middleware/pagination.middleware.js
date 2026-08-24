import { PAGINATION } from '../constants/index.js';

export const paginationMiddleware = (req, res, next) => {
    let { page, limit } = req.query;

    const limitParsed = parseInt(limit, 10);
    const pageParsed = parseInt(page, 10);

    limit = Number.isInteger(limitParsed) ? limitParsed : PAGINATION.DEFAULT_LIMIT;
    page = Number.isInteger(pageParsed) ? pageParsed : 1;
    
    if (limit <= 0) limit = PAGINATION.DEFAULT_LIMIT;
    if (page <= 0) page = 1;

    limit = Math.min(limit, PAGINATION.MAX_LIMIT);
    page = Math.min(page, PAGINATION.MAX_PAGE);

    req.pagination = {
        page,
        limit,
        offset: (page - 1) * limit
    };

    next();
};
