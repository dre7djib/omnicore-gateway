const jwt = require('jsonwebtoken');
const config = require('../config');
const { logger } = require('../config/logger');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Missing or malformed Authorization header', status: 401 },
    });
  }

  const token = authHeader.slice(7);

  if (!config.jwtSecret) {
    logger.error('JWT_SECRET is not configured');
    return res.status(500).json({
      error: { message: 'Internal server error', status: 500 },
    });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      countryId: payload.countryId || null,
    };
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({
      error: { message, status: 401 },
    });
  }
};

module.exports = authenticate;
