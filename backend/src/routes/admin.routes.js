import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

// Authorize ADMIN-only for all routes in this module
router.use(verifyToken);
router.use(authorizeRoles('ADMIN'));

// Schemas
const uuidOrIdSchema = z.string().trim().min(1);

const getUsersQuerySchema = {
  query: z.object({
    search: z.string().optional(),
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

const updateUserRoleSchema = {
  params: z.object({
    userId: uuidOrIdSchema,
  }),
  body: z.object({
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
  }),
};

const updateUserStatusSchema = {
  params: z.object({
    userId: uuidOrIdSchema,
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
  }),
};

const getAuditLogsQuerySchema = {
  query: z.object({
    action_type: z.string().optional(),
    user_id: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

// 1. GET /api/admin/users
router.get(
  '/users',
  validate(getUsersQuerySchema),
  paginationMiddleware,
  adminController.getUsers
);

// 2. PATCH /api/admin/users/:userId/role
router.patch(
  '/users/:userId/role',
  validate(updateUserRoleSchema),
  adminController.updateUserRole
);

// 3. PATCH /api/admin/users/:userId/status
router.patch(
  '/users/:userId/status',
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);

// 4. GET /api/admin/audit-logs
router.get(
  '/audit-logs',
  validate(getAuditLogsQuerySchema),
  paginationMiddleware,
  adminController.getAuditLogs
);

// 5. GET /api/admin/dashboard/overview
router.get(
  '/dashboard/overview',
  adminController.getDashboardOverview
);

export default router;
