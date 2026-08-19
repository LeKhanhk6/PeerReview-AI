import * as authService from '../services/auth.service.js';

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
        
        const normalizedEmail = email.trim().toLowerCase();
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

// FOR TESTING RBAC ONLY
export const adminOnly = (req, res) => {
    return res.status(200).json({ message: 'Welcome Admin!' });
};

export const staffOnly = (req, res) => {
    return res.status(200).json({ message: 'Welcome Staff!' });
};
