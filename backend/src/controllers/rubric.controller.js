import * as rubricService from '../services/rubric.service.js';
import * as assignmentService from '../services/assignment.service.js';
import { AppError } from '../utils/AppError.js';

export const getRubricByAssignment = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const user = req.user;

        // Kiểm tra quyền truy cập Assignment bằng service có sẵn (dành cho việc xem)
        try {
            await assignmentService.getAssignmentById(assignmentId, user);
        } catch (e) {
            if (e.status === 404) {
                // Nếu catch được 404, cần phân biệt đây là "Thực sự không tồn tại" hay "Không có quyền" (403)
                const exists = await assignmentService.getAssignmentOwnershipInfo(assignmentId);
                if (!exists) {
                    throw new AppError('Assignment not found', 404);
                }
                throw new AppError('Forbidden: You do not have permission to view this assignment', 403);
            }
            throw e;
        }

        // Lấy Rubric
        const rubric = await rubricService.getRubricAndCriteria(assignmentId, user);
        if (!rubric) {
            throw new AppError('Rubric not found for this assignment', 404);
        }

        return res.ok(rubric);
    } catch (error) {
        next(error);
    }
};

export const saveRubric = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const user = req.user;
        const { description, criteria } = req.body;

        // 2. Kiểm tra Assignment tồn tại và Quyền sở hữu (Ownership/Role)
        const assignmentInfo = await assignmentService.getAssignmentOwnershipInfo(assignmentId);
        if (!assignmentInfo) {
            throw new AppError('Assignment not found', 404);
        }

        if (user.role === 'TEACHER') {
            if (assignmentInfo.teacher_id !== user.userId) {
                throw new AppError('Forbidden: You do not manage this assignment', 403);
            }
        } else if (user.role !== 'ADMIN') {
            throw new AppError('Forbidden: Only Teacher and Admin can manage rubrics', 403);
        }
        // ADMIN được đi tiếp

        // 4. Lưu Rubric (Transaction đã được xử lý trong service)
        const savedRubric = await rubricService.saveRubric(assignmentId, description, criteria, user);
        
        return res.ok(savedRubric);
    } catch (error) {
        next(error);
    }
};
