import express from 'express';
import { z } from 'zod';
import * as groupController from '../controllers/group.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// Tất cả endpoints đều yêu cầu đăng nhập
router.use(verifyToken);

// Schemas
const uuidSchema = z.string().uuid();
const idParamSchema = z.object({ id: uuidSchema });
const idAndUserIdParamSchema = z.object({ id: uuidSchema, userId: uuidSchema });

const getAllSchema = {
    query: z.object({
        classId: uuidSchema.optional()
    })
};

const createSchema = {
    body: z.object({
        class_id: uuidSchema,
        name: z.string().min(1).max(100).trim()
    })
};

const addMemberSchema = {
    params: idParamSchema,
    body: z.object({
        user_id: uuidSchema
    })
};

const assignLeaderSchema = {
    params: idParamSchema,
    body: z.object({
        user_id: uuidSchema
    })
};

// API chung (quyền hạn được xử lý trong logic Controller/Service)
router.get('/', validate(getAllSchema), groupController.getAll);
router.get('/:id', validate({ params: idParamSchema }), groupController.getById);

// ADMIN và TEACHER
router.post('/', authorizeRoles('TEACHER', 'ADMIN'), validate(createSchema), groupController.create);
router.post('/:id/members', authorizeRoles('TEACHER', 'ADMIN'), validate(addMemberSchema), groupController.addMember);
router.delete('/:id/members/:userId', authorizeRoles('TEACHER', 'ADMIN'), validate({ params: idAndUserIdParamSchema }), groupController.removeMember);
router.put('/:id/leader', authorizeRoles('TEACHER', 'ADMIN'), validate(assignLeaderSchema), groupController.assignLeader);

// STUDENT
router.post('/:id/join', authorizeRoles('STUDENT'), validate({ params: idParamSchema }), groupController.joinGroup);
router.delete('/:id/leave', authorizeRoles('STUDENT'), validate({ params: idParamSchema }), groupController.leaveGroup);

export default router;
