import express from 'express';
import * as assignmentController from '../controllers/assignment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

// Bắt buộc đăng nhập cho tất cả
router.use(verifyToken);

// Tất cả roles (đã được phân loại logic bên trong service)
router.get('/', assignmentController.getAll);
router.get('/:id/detail', assignmentController.getAssignmentDetail);
router.get('/:id', assignmentController.getById);

// Chỉ giáo viên và admin được thao tác (quyền sở hữu được kiểm tra trong Controller)
router.post('/', authorizeRoles('TEACHER', 'ADMIN'), assignmentController.create);
router.put('/:id', authorizeRoles('TEACHER', 'ADMIN'), assignmentController.update);
router.delete('/:id', authorizeRoles('TEACHER', 'ADMIN'), assignmentController.remove);

export default router;