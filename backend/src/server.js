import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { responseMiddleware } from './middleware/response.middleware.js';
import errorHandler from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import classesRoutes from './routes/classes.routes.js';
import assignmentRoutes from './routes/assignments.routes.js';
import rubricRoutes from './routes/rubrics.routes.js';
import groupRoutes from './routes/groups.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import submissionRoutes from './routes/submissions.routes.js';
import reviewAssignmentRoutes from './routes/review-assignments.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import contributionRoutes from './routes/contribution.routes.js';
import summaryRoutes from './routes/summary.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import telemetryRoutes from './routes/telemetry.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { startDeadlineCronJob } from './services/cron-deadline.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware
app.use(requestLogger);
app.use(responseMiddleware);
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        // Trong môi trường Production, CHỈ cho phép tên miền thật
        if (process.env.NODE_ENV === 'production') {
            const allowedOrigins = ['https://your-production-domain.com'];
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        }
        
        // Trong môi trường Development, cho phép localhost chạy cổng bất kỳ
        if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

// Gọi hàm kiểm tra kết nối Database & Cron Scheduler
connectDB();
startDeadlineCronJob();


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', workspaceRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api', reviewAssignmentRoutes);
app.use('/api', reviewRoutes);
app.use('/api/groups', contributionRoutes);
app.use('/api', summaryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', telemetryRoutes);
app.use('/api/admin', adminRoutes);


// API Test cơ bản
app.get('/api/health', (req, res) => {
    res.json({ data: { status: 'ok', message: 'PeerReview-AI Backend is running!' } });
});

// Centralized Error Handler (Must be last)
app.use(errorHandler);

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
