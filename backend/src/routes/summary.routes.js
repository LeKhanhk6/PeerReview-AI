import express from 'express';
import { verifyToken, authorize } from '../middleware/auth.middleware.js';
import * as summaryController from '../controllers/summary.controller.js';
import { validateUUID } from '../middleware/validation.middleware.js';

const router = express.Router();

// Tất cả các route này chỉ dành cho TEACHER và ADMIN
router.use(verifyToken);
router.use(authorize('TEACHER', 'ADMIN'));

// Lấy danh sách source reviews cho một submission (có hỗ trợ pagination)
router.get(
    '/submissions/:submissionId/reviews',
    validateUUID('submissionId'),
    summaryController.getSourceReviews
);

// Lấy chi tiết Review Summary của một submission
router.get(
    '/submissions/:submissionId/summary',
    validateUUID('submissionId'),
    summaryController.getReviewSummary
);

// Chỉnh sửa một summary item
router.patch(
    '/summary-items/:itemId',
    validateUUID('itemId'),
    summaryController.updateSummaryItem
);

// Duyệt summary
router.patch(
    '/submissions/:submissionId/summary/approve',
    validateUUID('submissionId'),
    summaryController.approveReviewSummary
);

export default router;
