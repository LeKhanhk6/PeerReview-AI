import express from 'express';
import { z } from 'zod';
import * as taskController from '../controllers/task.controller.js';
import * as discussionController from '../controllers/discussion.controller.js';
import * as fileController from '../controllers/file.controller.js';
import * as activityController from '../controllers/activity.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';
import { TASK_STATUS } from '../constants/index.js';

const router = express.Router();

// Áp dụng middleware xác thực JWT cho toàn bộ workspace routes
router.use(verifyToken);

// ==========================================
// SCHEMAS
// ==========================================
const uuidSchema = z.string().trim().min(1);
const idParamSchema = z.object({ id: z.string().trim().min(1) });
const taskIdParamSchema = z.object({ taskId: z.string().trim().min(1) });

const createTaskSchema = {
    params: idParamSchema,
    body: z.object({
        title: z.string().min(1).max(255),
        status: z.enum(Object.values(TASK_STATUS)).optional(),
        assignee_id: uuidSchema.optional().nullable()
    })
};

const updateTaskSchema = {
    params: taskIdParamSchema,
    body: z.object({
        title: z.string().min(1).max(255).optional(),
        status: z.enum(Object.values(TASK_STATUS)).optional(),
        assignee_id: uuidSchema.optional().nullable()
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one valid field is required for update"
    })
};

const createDiscussionSchema = {
    params: idParamSchema,
    body: z.object({
        message: z.string().min(1)
    })
};

const createFileSchema = {
    params: idParamSchema,
    body: z.object({
        fileName: z.string().min(1),
        fileUrl: z.string().url()
    })
};

// ==========================================
// TASK MANAGEMENT ROUTES
// ==========================================
router.get('/groups/:id/tasks', validate({ params: idParamSchema }), taskController.getTasks);
router.post('/groups/:id/tasks', validate(createTaskSchema), taskController.createTask);
router.patch('/tasks/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.delete('/tasks/:taskId', validate({ params: taskIdParamSchema }), taskController.deleteTask);

// ==========================================
// GROUP DISCUSSIONS ROUTES
// ==========================================
router.get('/groups/:id/discussions', validate({ params: idParamSchema }), discussionController.getDiscussions);
router.post('/groups/:id/discussions', validate(createDiscussionSchema), discussionController.createDiscussion);

// ==========================================
// GROUP FILES ROUTES
// ==========================================
router.get('/groups/:id/files', validate({ params: idParamSchema }), fileController.getFiles);
router.post('/groups/:id/files', validate(createFileSchema), fileController.createFile);

// ==========================================
// ACTIVITY LOGS ROUTES
// ==========================================
router.get('/groups/:id/activities', validate({ params: idParamSchema }), paginationMiddleware, activityController.getActivities);

export default router;
