import * as authService from '../services/auth.service.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const data = await authService.loginUser(email, password);
        res.status(200).json({ message: 'Login successful', ...data });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

export const logout = async (req, res) => {
    // In a stateless JWT system, logout is usually handled by the client deleting the token.
    res.status(200).json({ message: 'Logout successful' });
};

export const getMe = async (req, res) => {
    try {
        const userId = req.user?.userId; 
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await authService.getUserById(userId);
        res.status(200).json({ user });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};
