import express from 'express';
import * as groupController from '../controllers/group.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

// Tất cả endpoints đều yêu cầu đăng nhập
router.use(verifyToken);

// API chung (quyền hạn được xử lý trong logic Controller/Service)
router.get('/', groupController.getAll);
router.get('/:id', groupController.getById);

// ADMIN và TEACHER
router.post('/', authorizeRoles('TEACHER', 'ADMIN'), groupController.create);
router.post('/:id/members', authorizeRoles('TEACHER', 'ADMIN'), groupController.addMember);
router.delete('/:id/members/:userId', authorizeRoles('TEACHER', 'ADMIN'), groupController.removeMember);

export default router;
