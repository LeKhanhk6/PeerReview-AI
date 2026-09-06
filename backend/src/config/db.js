import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Đảm bảo Node.js TLS chấp nhận self-signed certificate của Supabase Pooler trên Cloud Render
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pkg;

// Xóa query param sslmode nếu có để tránh pg-connection-string ghi đè rejectUnauthorized: false
const rawUrl = process.env.DATABASE_URL || '';
const cleanConnectionString = rawUrl.replace(/(\?|&)sslmode=[^&]*/, '');

// Khởi tạo Pool kết nối đến Supabase PostgreSQL
const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: {
        rejectUnauthorized: false
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
