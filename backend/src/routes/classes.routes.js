import express from 'express';
import { z } from 'zod';
import * as classController from '../controllers/class.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// Tất cả endpoints đều yêu cầu đăng nhập
router.use(verifyToken);

// Schemas
const uuidSchema = z.string().uuid();
const idParamSchema = z.object({ id: uuidSchema });

const createSchema = {
    body: z.object({
        course_code: z.string().min(1).max(50).trim(),
        course_name: z.string().min(1).max(255).trim(),
        name: z.string().min(1).max(255).trim(),
        semester: z.string().max(50).trim().optional().nullable()
    })
};

const updateSchema = {
    params: idParamSchema,
    body: z.object({
        course_code: z.string().min(1).max(50).trim().optional(),
        course_name: z.string().min(1).max(255).trim().optional(),
        name: z.string().min(1).max(255).trim().optional(),
        semester: z.string().max(50).trim().optional().nullable()
    })
};

const joinSchema = {
    body: z.object({
        invite_code: z.string().min(6).trim()
    })
};

// --- ROUTES ---

// TEACHER & ADMIN & STUDENT routes
router.get('/', authorizeRoles('TEACHER', 'ADMIN', 'STUDENT'), classController.getAll);
router.get('/:id', authorizeRoles('TEACHER', 'ADMIN', 'STUDENT'), validate({ params: idParamSchema }), classController.getById);
router.get('/:id/members', authorizeRoles('TEACHER', 'ADMIN', 'STUDENT'), validate({ params: idParamSchema }), classController.getMembers);

// TEACHER & ADMIN routes
router.post('/', authorizeRoles('TEACHER', 'ADMIN'), validate(createSchema), classController.create);
router.put('/:id', authorizeRoles('TEACHER', 'ADMIN'), validate(updateSchema), classController.update);
router.delete('/:id', authorizeRoles('TEACHER', 'ADMIN'), validate({ params: idParamSchema }), classController.remove);

// STUDENT routes
router.post('/join', authorizeRoles('STUDENT'), validate(joinSchema), classController.join);

export default router;
