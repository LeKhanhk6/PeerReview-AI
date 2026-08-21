import * as authService from '../services/auth.service.js';

export const register = async (req, res) => {
    try {
        // Input Sanitize: Bóc tách đúng trường cần thiết
        let { full_name, email, password } = req.body;

        // Null guard & type check
        if (
            typeof full_name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({ message: 'full_name, email, and password must be strings' });
        }

        email = email.trim().toLowerCase();
        
        // Format validation for Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        full_name = full_name.trim();
        if (full_name.length < 2 || full_name.length > 255) {
            return res.status(400).json({ message: 'Full name must be between 2 and 255 characters' });
        }

        if (password.trim().length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Gọi service xử lý logic DB
        const user = await authService.registerUser(full_name, email, password);

        // Logging
        console.info('User registered', { email: user.email, userId: user.id });

        // Trả về kết quả
        return res.status(201).json({
            data: {
                id: user.id,
                email: user.email,
                role: 'STUDENT',
                created_at: user.created_at
            }
        });
    } catch (error) {
        const status = error.status || 500;
        console.error('Register error:', error);
        return res.status(status).json({
            message: status === 500 ? 'Internal Server Error' : error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalizedEmail = email.trim().toLowerCase();
        
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        const data = await authService.loginUser(normalizedEmail, password);
        
        return res.status(200).json({ message: 'Login successful', ...data });
    } catch (error) {
        const status = error.status || 500;
        console.error('Login error:', error);
        return res.status(status).json({ 
            message: status === 500 ? 'Internal Server Error' : error.message 
        });
    }
};

export const logout = async (req, res) => {
    // JWT is stateless.
    // The client is responsible for removing the stored token.
    return res.status(200).json({ message: 'Logout successful' });
};

export const getMe = async (req, res) => {
    try {
        const userId = req.user?.userId; 
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const user = await authService.getUserById(userId);
        return res.status(200).json({ user });
    } catch (error) {
        const status = error.status || 500;
        console.error('GetMe error:', error);
        return res.status(status).json({ 
            message: status === 500 ? 'Internal Server Error' : error.message 
        });
    }
};


