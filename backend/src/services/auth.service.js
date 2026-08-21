import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

let cachedStudentRoleId = null;

const getStudentRoleId = async () => {
    if (cachedStudentRoleId) return cachedStudentRoleId;
    const res = await pool.query("SELECT id FROM roles WHERE name = 'STUDENT' LIMIT 1");
    if (res.rows.length === 0) throw new AppError('Role STUDENT not found in database', 500);
    cachedStudentRoleId = res.rows[0].id;
    return cachedStudentRoleId;
};

export const registerUser = async (fullName, email, password) => {
    // 1. Mã hoá mật khẩu
    const passwordHash = await bcrypt.hash(password, 10);
    
    try {
        const studentRoleId = await getStudentRoleId();
        
        // 2. Chèn vào DB (phòng tránh race condition, bỏ qua truy vấn SELECT trước khi INSERT)
        const query = `
            INSERT INTO users (full_name, email, password_hash, role_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, created_at
        `;
        
        const result = await pool.query(query, [fullName, email, passwordHash, studentRoleId]);
        return result.rows[0];
    } catch (err) {
        // Handle postgres unique violation error
        if (err.code === '23505') {
            throw new AppError('Email already exists', 400);
        }
        throw err;
    }
};

export const loginUser = async (email, password) => {
    // Tìm user và role name
    const query = `
        SELECT u.id, u.email, u.password_hash, u.full_name, u.student_id, r.name as role
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    if (result.rows.length === 0) {
        throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    if (!user.role) {
        throw new AppError('User role is not assigned', 403);
    }
    
    // Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    // Tạo token
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            student_id: user.student_id,
            role: user.role
        }
    };
};

export const getUserById = async (userId) => {
    const query = `
        SELECT u.id, u.email, u.full_name, u.student_id, r.name as role
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
    }
    return result.rows[0];
};
