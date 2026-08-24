import logger from '../utils/logger.util.js';

export default function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;

  if (status >= 500) {
    logger.error({ event: 'request.error', status, code: err.code, message: err.message, stack: err.stack });
  } else {
    logger.info({ event: 'request.failed', status, code: err.code, message: err.message, details: err.details });
  }

  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      details: err.details || null
    }
  });
}
