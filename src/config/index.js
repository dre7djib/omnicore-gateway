require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
};
