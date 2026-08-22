import AppError from '../utils/AppError.js';
import * as analyticsService from '../services/analytics.service.js';
import { isValidUUID } from '../utils/validation.util.js';

export const getDashboardOverview = async (req, res, next) => {
    try {
        const classId = req.query.classId || null;
        
        if (classId && !isValidUUID(classId)) {
            throw new AppError('Invalid classId format', 400);
        }

        const metrics = await analyticsService.getDashboardOverview(req.user, classId);
        
        res.json({ data: metrics });
    } catch (error) {
        next(error);
    }
};
