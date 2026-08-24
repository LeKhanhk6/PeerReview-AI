export const responseMiddleware = (req, res, next) => {
    // res.ok(data)
    res.ok = (data = null, statusCode = 200) => {
        res.status(statusCode).json({ data });
    };

    // res.paginate(data, meta)
    res.paginate = (data, meta = {}, statusCode = 200) => {
        res.status(statusCode).json({
            data,
            pagination: {
                page: meta.page || 1,
                limit: meta.limit || data.length,
                hasNext: meta.hasNext || false,
                total: meta.total
            }
        });
    };

    // res.fail(error)
    res.fail = (error, statusCode = 400, code = 'BAD_REQUEST') => {
        const errorResponse = {
            message: error.message || 'Error occurred',
            code: error.code || code,
            details: error.details || null
        };
        res.status(statusCode).json({ error: errorResponse });
    };

    next();
};
