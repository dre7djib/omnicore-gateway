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

  const status = err.status || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  res.status(status).json({
    error: {
      code,
      message: status === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
      status,
      correlationId,
    },
  });
};

module.exports = errorHandler;
