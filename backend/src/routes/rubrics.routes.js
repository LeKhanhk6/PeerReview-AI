import express from 'express';
import * as rubricController from '../controllers/rubric.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

// Tất cả các route quản lý Rubric đều yêu cầu đăng nhập
router.use(verifyToken);

// Lấy thông tin Rubric & Criteria theo Assignment ID
router.get('/assignment/:assignmentId', rubricController.getRubricByAssignment);

// Tạo mới hoặc cập nhật Rubric & Criteria
// Chỉ TEACHER và ADMIN được phép gọi API này. Quyền sở hữu (Ownership) sẽ được check ở Controller
router.put('/assignment/:assignmentId', authorizeRoles('TEACHER', 'ADMIN'), rubricController.saveRubric);

export default router;
