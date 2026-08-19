import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import assignmentRoutes from './routes/assignments.routes.js';
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

// API Test cơ bản
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PeerReview-AI Backend is running!' });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

