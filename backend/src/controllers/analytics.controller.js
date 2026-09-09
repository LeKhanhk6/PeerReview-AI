import { AppError } from '../utils/AppError.js';
import * as analyticsService from '../services/analytics.service.js';
import * as contributionService from '../services/contribution.service.js';
import pool from '../config/db.js';

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

// --- TASK 5 ---
export const getAssignmentGroupAnalytics = async (req, res, next) => {
    try {
        const { assignmentId, groupId } = req.params;
        const user = req.user;

        const results = await contributionService.getAssignmentGroupAnalytics(assignmentId, groupId);
        
        // Check if snapshot is published
        const isPublished = results.length > 0 && results[0].isPublished;
        const userRole = typeof user?.role === 'object' ? user.role?.name : user?.role;

        if (userRole === 'STUDENT' && !isPublished) {
            return res.status(403).json({ message: 'Chờ giảng viên công bố kết quả đánh giá' });
        }

        return res.ok(results);
    } catch (error) {
        next(error);
    }
};

export const publishGroupAnalytics = async (req, res, next) => {
    try {
        const { assignmentId, groupId } = req.params;
        const user = req.user;
        const userRole = typeof user?.role === 'object' ? user.role?.name : user?.role;

        // Contextual Permission Check: Verify teacher owns the class containing this assignment
        const checkRes = await pool.query(`
            SELECT c.teacher_id, a.deadline 
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            WHERE a.id = $1
        `, [assignmentId]);

        if (checkRes.rowCount === 0) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const { teacher_id } = checkRes.rows[0];

        const userId = user?.id || user?.userId;
        if (userRole !== 'ADMIN' && teacher_id !== userId) {
            return res.status(403).json({ message: 'Bạn không có quyền Publish dữ liệu của lớp này' });
        }

        // Must have at least 1 evaluation
        const evalsRes = await pool.query(`
            SELECT COUNT(*) FROM internal_evaluations 
            WHERE assignment_id = $1 AND group_id = $2
        `, [assignmentId, groupId]);

        if (parseInt(evalsRes.rows[0].count, 10) === 0) {
            return res.status(400).json({ message: 'Không thể công bố vì nhóm chưa có phiếu chấm nào' });
        }

        const results = await contributionService.publishAssignmentContributions(assignmentId, groupId);
        return res.ok(results);
    } catch (error) {
        next(error);
    }
};
