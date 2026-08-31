import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { setUserId } from '../utils/context.util.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

export const verifyToken = (req, res, next) => {
    let token = null;

    // 1. Check Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // 2. Check req.cookies if cookie-parser is used
    if (!token && req.cookies?.token) {
        token = req.cookies.token;
    }

    // 3. Fallback to manually parsing req.headers.cookie if cookie-parser is not used
    if (!token && req.headers.cookie) {
        const cookiePairs = req.headers.cookie.split(';');
        for (const pair of cookiePairs) {
            const [key, ...valueParts] = pair.trim().split('=');
            if (key === 'token') {
                token = valueParts.join('=');
                break;
            }
        }
    }

    if (!token) {
        throw new AppError('No token provided, authorization denied', 401, 'UNAUTHORIZED');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, role }
        req.user.userId = decoded.id || decoded.userId; // ensure backward compatibility
        
        // Propagate userId to AsyncLocalStorage
        setUserId(req.user.userId);
        
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
        }
        throw new AppError('Token is not valid', 401, 'UNAUTHORIZED');
    }
};
