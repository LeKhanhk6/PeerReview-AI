import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

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
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
    }

    const user = result.rows[0];
    
    // Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
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
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }
    return result.rows[0];
};
