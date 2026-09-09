import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import * as summaryController from '../controllers/summary.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';

const router = express.Router();
const authMiddlewares = [verifyToken, authorizeRoles('TEACHER', 'ADMIN')];

// Schemas
const uuidSchema = z.string().uuid();
const submissionIdParamSchema = z.object({ submissionId: uuidSchema });
const itemIdParamSchema = z.object({ itemId: uuidSchema });

const updateItemSchema = {
    params: itemIdParamSchema,
    body: z.object({
        content: z.string().min(1).max(2000).trim().optional(),
        note: z.string().max(1000).trim().optional(),
        updatedAt: z.string().datetime()
    }).strict() // ensure no extra fields are passed
};

// Lấy danh sách source reviews cho một submission (có hỗ trợ pagination)
router.get(
    '/submissions/:submissionId/reviews',
    authMiddlewares,
    validate({ params: submissionIdParamSchema }),
    paginationMiddleware,
    summaryController.getSourceReviews
);

// Lấy chi tiết Review Summary của một submission
router.get(
    '/submissions/:submissionId/summary',
    authMiddlewares,
    validate({ params: submissionIdParamSchema }),
    summaryController.getReviewSummary
);

// Chỉnh sửa một summary item
router.patch(
    '/summary-items/:itemId',
    authMiddlewares,
    validate(updateItemSchema),
    summaryController.updateSummaryItem
);

// Xóa một summary item
router.delete(
    '/summary-items/:itemId',
    authMiddlewares,
    validate({ params: itemIdParamSchema }),
    summaryController.deleteSummaryItem
);

// Kiểm tra trạng thái synthesis job (Task B3 - Polling endpoint)
router.get(
    '/submissions/:submissionId/summary/status',
    authMiddlewares,
    validate({ params: submissionIdParamSchema }),
    summaryController.getSummaryStatus
);

// Duyệt summary
router.patch(
    '/submissions/:submissionId/summary/approve',
    authMiddlewares,
    validate({ params: submissionIdParamSchema }),
    summaryController.approveReviewSummary
);

// Tạo mới bản tổng hợp AI cho 1 bài nộp (On-demand)
router.post(
    '/submissions/:submissionId/summary/generate',
    authMiddlewares,
    validate({ params: submissionIdParamSchema }),
    summaryController.generateSubmissionSummary
);

export default router;

