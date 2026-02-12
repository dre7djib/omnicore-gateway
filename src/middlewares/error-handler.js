const { logger } = require('../config/logger');

const errorHandler = (err, req, res, _next) => {
  const correlationId = req.correlationId ? req.correlationId() : 'unknown';

  logger.error(
    {
      err,
      correlationId,
      status: err.status || 500,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    },
    'Unhandled application error',
  );

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      correlationId,
    },
  });
};

module.exports = errorHandler;
