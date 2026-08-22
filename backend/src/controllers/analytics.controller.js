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

export const getGroupContribution = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        if (!isValidUUID(groupId)) {
            throw new AppError('Invalid groupId format', 400);
        }

        const metrics = await analyticsService.getGroupContribution(req.user, groupId);
        res.json({ data: metrics });
    } catch (error) {
        next(error);
    }
};

export const getClassContributions = async (req, res, next) => {
    try {
        const { classId } = req.params;
        if (!isValidUUID(classId)) {
            throw new AppError('Invalid classId format', 400);
        }

        const metrics = await analyticsService.getClassContributions(req.user, classId);
        res.json({ data: metrics });
    } catch (error) {
        next(error);
    }
};

export const getAssignmentReviewAnalytics = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        if (!isValidUUID(assignmentId)) {
            throw new AppError('Invalid assignmentId format', 400);
        }

        const metrics = await analyticsService.getAssignmentReviewAnalytics(req.user, assignmentId);
        res.json({ data: metrics });
    } catch (error) {
        next(error);
    }
};

export const getClassReviewAnalytics = async (req, res, next) => {
    try {
        const { classId } = req.params;
        if (!isValidUUID(classId)) {
            throw new AppError('Invalid classId format', 400);
        }

        const metrics = await analyticsService.getClassReviewAnalytics(req.user, classId);
        res.json({ data: metrics });
    } catch (error) {
        next(error);
    }
};
