import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import * as taskController from '../controllers/task.controller.js';
import * as discussionController from '../controllers/discussion.controller.js';
import * as fileController from '../controllers/file.controller.js';
import * as activityController from '../controllers/activity.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';
import { TASK_STATUS } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';

const router = express.Router();

router.use(verifyToken);

// ==========================================
// MULTER SETUP
// ==========================================
const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/msword', // doc
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/vnd.ms-powerpoint', // ppt
    'text/plain', // txt
    'application/zip', // zip
    'image/png', // png
    'image/jpeg' // jpg
];

const allowedExtensions = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'zip', 'png', 'jpg'];

const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('INVALID_FILE_TYPE'));
        }
    }
});

const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new AppError('File vượt quá giới hạn 10MB', 413, 'FILE_TOO_LARGE'));
            }
            return next(new AppError(err.message, 400));
        } else if (err) {
            if (err.message === 'INVALID_FILE_TYPE') {
                return next(new AppError('Định dạng file không được hỗ trợ', 400, 'INVALID_FILE_TYPE'));
            }
            return next(err);
        }
        next();
    });
};

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
    params: idParamSchema
};

const downloadFileSchema = {
    params: z.object({
        groupId: z.string().trim().min(1),
        fileId: z.string().trim().min(1)
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
router.post('/groups/:id/files', handleUpload, validate(createFileSchema), fileController.createFile);
router.get('/groups/:groupId/files/:fileId/download', validate(downloadFileSchema), fileController.downloadFile);

// ==========================================
// ACTIVITY LOGS ROUTES
// ==========================================
router.get('/groups/:id/activities', validate({ params: idParamSchema }), paginationMiddleware, activityController.getActivities);

export default router;
