import { AppError } from '../utils/AppError.js';

export const formatZodError = (zodError) => {
    return zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
};

/**
 * Express middleware to validate request payload against Zod schemas.
 * @param {Object} schema - { body, params, query } Zod schemas
 */
export const validate = (schema) => (req, res, next) => {
    try {
        if (schema.params) {
            req.params = schema.params.parse(req.params);
        }
        if (schema.body) {
            req.body = schema.body.parse(req.body);
        }
        if (schema.query) {
            req.query = schema.query.parse(req.query);
        }
        next();
    } catch (error) {
        if (error.name === 'ZodError') {
            const details = formatZodError(error);
            next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
        } else {
            next(error);
        }
    }
};
