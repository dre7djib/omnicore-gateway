const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: 'Too many requests, please try again later', status: 429 },
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: 'Too many auth attempts, please try again later', status: 429 },
  },
});

module.exports = { globalLimiter, authLimiter };
