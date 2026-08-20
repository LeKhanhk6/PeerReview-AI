import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import assignmentRoutes from './routes/assignments.routes.js';
import rubricRoutes from './routes/rubrics.routes.js';
import groupRoutes from './routes/groups.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import submissionRoutes from './routes/submissions.routes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware
app.use(cors());
app.use(express.json());

// Gọi hàm kiểm tra kết nối Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', workspaceRoutes);
app.use('/api/submissions', submissionRoutes);

// API Test cơ bản
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PeerReview-AI Backend is running!' });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

