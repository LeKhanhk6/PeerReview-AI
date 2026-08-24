import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Khởi tạo Pool kết nối đến Supabase PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Supabase yêu cầu SSL để kết nối từ xa
    }
});

// Hàm kiểm tra kết nối
export const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('Kết nối Database Supabase thành công!');
        client.release(); // Giải phóng kết nối sau khi test xong
    } catch (error) {
        console.error('Lỗi kết nối Database:', error.message);
        process.exit(1); // Dừng server nếu không kết nối được
    }
};

export default pool;
