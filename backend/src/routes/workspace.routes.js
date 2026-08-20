import express from 'express';
import * as workspaceController from '../controllers/workspace.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Áp dụng middleware xác thực JWT cho toàn bộ workspace routes
router.use(verifyToken);

// ==========================================
// TASK MANAGEMENT ROUTES
// ==========================================

// Lấy danh sách task của group
router.get('/groups/:id/tasks', workspaceController.getTasks);

// Tạo task mới trong group
router.post('/groups/:id/tasks', workspaceController.createTask);

// Cập nhật task (Partial Update)
router.patch('/tasks/:taskId', workspaceController.updateTask);

// Xóa task
router.delete('/tasks/:taskId', workspaceController.deleteTask);

// ==========================================
// GROUP DISCUSSIONS ROUTES
// ==========================================

// Lấy danh sách discussion của group
router.get('/groups/:id/discussions', workspaceController.getDiscussions);

// Đăng discussion mới
router.post('/groups/:id/discussions', workspaceController.createDiscussion);

// ==========================================
// GROUP FILES ROUTES
// ==========================================

// Lấy danh sách metadata files của group
router.get('/groups/:id/files', workspaceController.getFiles);

// Đăng/lưu file metadata/URL mới
router.post('/groups/:id/files', workspaceController.createFile);

export default router;
