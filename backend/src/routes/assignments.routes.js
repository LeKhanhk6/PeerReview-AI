import express from 'express';
import { z } from 'zod';
import * as assignmentController from '../controllers/assignment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// Bắt buộc đăng nhập cho tất cả
router.use(verifyToken);

// Schemas
const uuidSchema = z.string().uuid();
const idParamSchema = z.object({ id: uuidSchema });

const getAllSchema = {
    query: z.object({
        classId: uuidSchema.optional()
    })
};

const createSchema = {
    body: z.object({
        class_id: uuidSchema,
        title: z.string().min(1).max(255).trim(),
        description: z.string().trim().optional().nullable(),
        requirements: z.string().trim().optional().nullable(),
        deadline: z.string().datetime().refine(val => new Date(val) > new Date(), { message: 'Deadline must be in the future' }),
        attachments: z.array(z.object({
            file_name: z.string(),
            file_url: z.string(),
            file_type: z.string().optional(),
            file_size: z.number().optional()
        })).optional()
    })
};

const updateSchema = {
    params: idParamSchema,
    body: z.object({
        title: z.string().min(1).max(255).trim(),
        description: z.string().trim().optional().nullable(),
        requirements: z.string().trim().optional().nullable(),
        deadline: z.string().datetime(),
        attachments: z.array(z.object({
            file_name: z.string(),
            file_url: z.string(),
            file_type: z.string().optional(),
            file_size: z.number().optional()
        })).optional()
    })
};

// Upload attachment
router.post('/upload-attachment', authorizeRoles('TEACHER', 'ADMIN'), upload.single('file'), assignmentController.uploadAttachment);

// Tất cả roles (đã được phân loại logic bên trong service)
router.get('/', validate(getAllSchema), paginationMiddleware, assignmentController.getAll);
router.get('/:id/detail', validate({ params: idParamSchema }), assignmentController.getAssignmentDetail);
router.get('/:id', validate({ params: idParamSchema }), assignmentController.getById);

// Chỉ giáo viên và admin được thao tác (quyền sở hữu được kiểm tra trong Controller)
router.post('/', authorizeRoles('TEACHER', 'ADMIN'), validate(createSchema), assignmentController.create);
router.put('/:id', authorizeRoles('TEACHER', 'ADMIN'), validate(updateSchema), assignmentController.update);
router.delete('/:id', authorizeRoles('TEACHER', 'ADMIN'), validate({ params: idParamSchema }), assignmentController.remove);

export default router;
