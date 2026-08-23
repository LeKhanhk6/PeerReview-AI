import cacheInstance from '../providers/cache.provider.js';
import AppError from './AppError.js';
import logger from './logger.util.js';

/**
 * Check Rate Limit for expensive operations (like AI generation)
 * 
 * @param {string} userId 
 * @param {string} assignmentId 
 * @param {number} limit - Maximum requests allowed per window
 * @param {number} windowSeconds - Time window in seconds
 * @param {string} requestId 
 */
export const checkAiRateLimit = async (userId, assignmentId, limit = 3, windowSeconds = 60, requestId = 'unknown') => {
    // Key kết hợp cả user và assignment để tránh abuse
    const key = `rl_ai_${userId}_${assignmentId}`;
    
    const current = await cacheInstance.get(key) || { count: 0, windowStart: Date.now() };
    
    // Reset nếu vượt quá window (dù TTL của cache sẽ tự dọn)
    if (Date.now() - current.windowStart > windowSeconds * 1000) {
        current.count = 0;
        current.windowStart = Date.now();
    }
    
    current.count += 1;
    
    if (current.count > limit) {
        logger.warn({
            event: 'rate_limit_exceeded',
            userId,
            assignmentId,
            requestId,
            limit
        });
        throw new AppError('Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.', 429);
    }
    
    await cacheInstance.set(key, current, windowSeconds);
};
