import express from 'express';
import { z } from 'zod';
import * as rubricController from '../controllers/rubric.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// Tất cả các route quản lý Rubric đều yêu cầu đăng nhập
router.use(verifyToken);

// Schemas
const uuidSchema = z.string().uuid();
const assignmentIdParamSchema = z.object({ assignmentId: uuidSchema });

const saveRubricSchema = {
    params: assignmentIdParamSchema,
    body: z.object({
        description: z.string().trim().optional().nullable(),
        criteria: z.array(z.object({
            name: z.string().min(1).max(255).trim(),
            description: z.string().trim().optional().nullable(),
            weight: z.number().positive()
        })).min(1).refine(items => {
            const total = items.reduce((sum, item) => sum + item.weight, 0);
            return Math.abs(total - 100) < 0.01;
        }, { message: "Total weight must be 100%" })
    })
};

// Lấy thông字 Rubric & Criteria theo Assignment ID
router.get('/assignment/:assignmentId', validate({ params: assignmentIdParamSchema }), rubricController.getRubricByAssignment);

// Tạo mới hoặc cập nhật Rubric & Criteria
// Chỉ TEACHER và ADMIN được phép gọi API này. Quyền sở hữu (Ownership) sẽ được check ở Controller
router.put('/assignment/:assignmentId', authorizeRoles('TEACHER', 'ADMIN'), validate(saveRubricSchema), rubricController.saveRubric);

export default router;
