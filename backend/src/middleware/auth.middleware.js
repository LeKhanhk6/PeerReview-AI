import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { setUserId } from '../utils/context.util.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new AppError('No token provided, authorization denied', 401, 'UNAUTHORIZED');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
        throw new AppError('Invalid authorization format', 401, 'UNAUTHORIZED');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, role }
        
        // Propagate userId to AsyncLocalStorage
        setUserId(decoded.id || decoded.userId);
        
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
        }
        throw new AppError('Token is not valid', 401, 'UNAUTHORIZED');
    }
};
