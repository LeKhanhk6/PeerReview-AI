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
        
        // If it's a student, they can only see it if it's published!
        // We know it's published if `isPublished` is true for ANY result (or if results exist and have isPublished)
        const isPublished = results.length > 0 && results[0].isPublished;

        if (user.role.name === 'STUDENT' && !isPublished) {
            return res.status(403).json({ message: 'Chờ giảng viên công bố kết quả đánh giá' });
        }

        // Note: raw data is not exposed to Teacher either, only aggregate Si & classification (already handled in service mapping)
        return res.ok(results);
    } catch (error) {
        next(error);
    }
};

export const publishGroupAnalytics = async (req, res, next) => {
    try {
        const { assignmentId, groupId } = req.params;
        const user = req.user;

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

        const { teacher_id, deadline } = checkRes.rows[0];

        if (user.role.name !== 'ADMIN' && teacher_id !== user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền Publish dữ liệu của lớp này' });
        }

        // Window Constraint Check: Window must be closed before publish
        const now = new Date();
        const submissionDeadline = new Date(deadline);
        const reviewDeadline = new Date(submissionDeadline.getTime() + 24 * 60 * 60 * 1000);
        if (now < reviewDeadline) {
            return res.status(400).json({ message: 'Chưa thể công bố vì thời gian chấm nội bộ chưa kết thúc' });
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
