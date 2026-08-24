import { AppError } from '../utils/AppError.js';
import * as analyticsService from '../services/analytics.service.js';

export const getDashboardOverview = async (req, res, next) => {
    try {
        const classId = req.query.classId || null;
        
        const metrics = await analyticsService.getDashboardOverview(req.user, classId);
        
        return res.ok(metrics);
    } catch (error) {
        next(error);
    }
};

export const getGroupContribution = async (req, res, next) => {
    try {
        const { groupId } = req.params;

        const metrics = await analyticsService.getGroupContribution(req.user, groupId);
        return res.ok(metrics);
    } catch (error) {
        next(error);
    }
};

export const getClassContributions = async (req, res, next) => {
    try {
        const { classId } = req.params;

        const metrics = await analyticsService.getClassContributions(req.user, classId);
        return res.ok(metrics);
    } catch (error) {
        next(error);
    }
};

export const getAssignmentReviewAnalytics = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;

        const metrics = await analyticsService.getAssignmentReviewAnalytics(req.user, assignmentId);
        return res.ok(metrics);
    } catch (error) {
        next(error);
    }
};

export const getClassReviewAnalytics = async (req, res, next) => {
    try {
        const { classId } = req.params;

        const metrics = await analyticsService.getClassReviewAnalytics(req.user, classId);
        return res.ok(metrics);
    } catch (error) {
        next(error);
    }
};

export const getClassCollaborationRisks = async (req, res, next) => {
    try {
        const { classId } = req.params;

        const risks = await analyticsService.getCollaborationRisks(req.user, classId);
        return res.ok(risks);
    } catch (error) {
        next(error);
    }
};
