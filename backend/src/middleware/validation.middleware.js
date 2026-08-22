import AppError from '../utils/AppError.js';
import { isValidUUID } from '../utils/validation.util.js';

export const validateUUID = (paramName) => {
    return (req, res, next) => {
        const value = req.params[paramName];
        if (!value || !isValidUUID(value)) {
            return next(new AppError(`Invalid ${paramName} format`, 400));
        }
        next();
    };
};
