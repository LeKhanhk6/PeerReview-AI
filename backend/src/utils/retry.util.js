const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Centralized Utility for Exponential Backoff Retries.
 * 
 * @param {Function} fn - The async function to execute.
 * @param {Object} options 
 * @param {number} options.retries - Max number of retry attempts.
 * @param {number} options.baseDelay - Base delay in ms (will be multiplied exponentially).
 * @param {Function} options.shouldRetry - Evaluator function (err) => boolean to classify retryable errors.
 * @param {Object} options.logger - (Optional) custom logger instance to log retry events.
 * @param {string} options.requestId - Correlation ID.
 * @param {string} options.context - Additional context (e.g., 'ai_service', 'db_query') for logging.
 * @returns {Promise<any>}
 */
export const retryWithBackoff = async (fn, { 
    retries = 3, 
    baseDelay = 300, 
    shouldRetry = (err) => true, 
    logger = null,
    requestId = 'unknown',
    context = 'unknown_context'
} = {}) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (!shouldRetry(error) || attempt === retries) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt);
            
            if (logger) {
                logger.info({
                    event: 'retry_attempt',
                    requestId,
                    context,
                    attempt: attempt + 1,
                    delay,
                    error: error.message
                });
            }

            await sleep(delay);
        }
    }
};
