import express from 'express';
import * as taskController from '../controllers/task.controller.js';
import * as discussionController from '../controllers/discussion.controller.js';
import * as fileController from '../controllers/file.controller.js';
import * as activityController from '../controllers/activity.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Áp dụng middleware xác thực JWT cho toàn bộ workspace routes
router.use(verifyToken);

// ==========================================
// TASK MANAGEMENT ROUTES
// ==========================================
router.get('/groups/:id/tasks', taskController.getTasks);
router.post('/groups/:id/tasks', taskController.createTask);
router.patch('/tasks/:taskId', taskController.updateTask);
router.delete('/tasks/:taskId', taskController.deleteTask);

// ==========================================
// GROUP DISCUSSIONS ROUTES
// ==========================================
router.get('/groups/:id/discussions', discussionController.getDiscussions);
router.post('/groups/:id/discussions', discussionController.createDiscussion);

// ==========================================
// GROUP FILES ROUTES
// ==========================================
router.get('/groups/:id/files', fileController.getFiles);
router.post('/groups/:id/files', fileController.createFile);

// ==========================================
// ACTIVITY LOGS ROUTES
// ==========================================
router.get('/groups/:id/activities', activityController.getActivities);

export default router;
