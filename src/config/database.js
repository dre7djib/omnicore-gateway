const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { logger } = require('./logger');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

module.exports = { prisma, connectDB, disconnectDB };
