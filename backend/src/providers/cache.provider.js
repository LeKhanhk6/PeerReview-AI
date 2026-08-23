/**
 * Abstracted Cache Provider
 * Currently uses In-Memory Map() for MVP.
 * Designed to be swapped with Redis in the future without changing business logic.
 */
class MemoryCache {
    constructor() {
        this.cache = new Map();
        this.MAX_ITEMS = 2000; // Prevent memory leak

        // Periodic cleanup to avoid memory leak from un-accessed expired items
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, item] of this.cache.entries()) {
                if (now > item.expiry) {
                    this.cache.delete(key);
                }
            }
        }, 60000);
        // Ensure interval doesn't keep node process alive
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }

        // Clean shutdown
        process.on('SIGTERM', () => clearInterval(this.cleanupInterval));
    }

    /**
     * @param {string} key 
     * @returns {Promise<any|null>}
     */
    async get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        // True LRU: Move key to the end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }

    /**
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlSeconds - Default 300s (5 min)
     */
    async set(key, value, ttlSeconds = 300) {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiry });
        
        // LRU Eviction behavior
        if (this.cache.size > this.MAX_ITEMS) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * @param {string} key 
     */
    async delete(key) {
        this.cache.delete(key);
    }
}

/*
// Future Redis Implementation
class RedisCache {
    constructor(redisClient) { this.client = redisClient; }
    async get(key) { ... }
    async set(key, value, ttlSeconds) { ... }
    async delete(key) { ... }
}
*/

const cacheInstance = new MemoryCache();
export default cacheInstance;
