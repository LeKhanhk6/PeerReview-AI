import * as rubricService from '../services/rubric.service.js';
import * as assignmentService from '../services/assignment.service.js';
import { isValidUUID, isValidString, isValidOptionalString } from '../utils/validation.util.js';

export const getRubricByAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const user = req.user;

        if (!isValidUUID(assignmentId)) {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }

        // Kiểm tra quyền truy cập Assignment bằng service có sẵn (dành cho việc xem)
        try {
            await assignmentService.getAssignmentById(assignmentId, user);
        } catch (e) {
            if (e.status === 404) {
                // Nếu catch được 404, cần phân biệt đây là "Thực sự không tồn tại" hay "Không có quyền" (403)
                const exists = await assignmentService.getAssignmentOwnershipInfo(assignmentId);
                if (!exists) {
                    return res.status(404).json({ message: 'Assignment not found' });
                }
                return res.status(403).json({ message: 'Forbidden: You do not have permission to view this assignment' });
            }
            throw e;
        }

        // Lấy Rubric
        const rubric = await rubricService.getRubricAndCriteria(assignmentId);
        if (!rubric) {
            return res.status(404).json({ message: 'Rubric not found for this assignment' });
        }

        return res.status(200).json(rubric);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};

export const saveRubric = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const user = req.user;
        const { description, criteria } = req.body;

        // 1. Validate Assignment ID
        if (!isValidUUID(assignmentId)) {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }

        // 2. Kiểm tra Assignment tồn tại và Quyền sở hữu (Ownership/Role)
        const assignmentInfo = await assignmentService.getAssignmentOwnershipInfo(assignmentId);
        if (!assignmentInfo) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (user.role === 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden: Students cannot create or update rubrics' });
        } else if (user.role === 'TEACHER' && assignmentInfo.teacher_id !== user.userId) {
            return res.status(403).json({ message: 'Forbidden: You do not manage this assignment' });
        }
        // ADMIN được đi tiếp

        // 3. Validate Payload
        if (!isValidOptionalString(description)) {
            return res.status(400).json({ message: 'Description must be a string' });
        }

        if (!Array.isArray(criteria) || criteria.length === 0) {
            return res.status(400).json({ message: 'Criteria must be a non-empty array' });
        }

        let totalWeight = 0;
        for (const c of criteria) {
            if (!isValidString(c.name, 255)) {
                return res.status(400).json({ message: 'Each criteria must have a valid name (max 255 chars)' });
            }
            if (!isValidOptionalString(c.description)) {
                return res.status(400).json({ message: 'Criteria description must be a string' });
            }
            if (typeof c.weight !== 'number' || isNaN(c.weight) || c.weight <= 0) {
                return res.status(400).json({ message: 'Each criteria must have a valid positive numeric weight' });
            }
            totalWeight += c.weight;
        }

        // Validate tổng weight = 100 với sai số nhỏ để tránh lỗi float trong JS
        if (Math.abs(totalWeight - 100) >= 0.01) {
            return res.status(400).json({ message: `Total weight must be 100%. Current total: ${totalWeight}` });
        }

        // 4. Lưu Rubric (Transaction đã được xử lý trong service)
        const savedRubric = await rubricService.saveRubric(assignmentId, description, criteria);
        
        return res.status(200).json(savedRubric);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};
