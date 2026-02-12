const { Router } = require('express');
const { prisma } = require('../config/database');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { logger } = require('../config/logger');

const router = Router();

// All role routes require authentication + authorization (Principal only per rbac.js)
router.use(authenticate, authorize);

// Parse JSON only for gateway-local role routes
router.use(require('express').json());

// GET /api/roles — List all roles
router.get('/', async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(roles);
  } catch (err) {
    next(err);
  }
});

// GET /api/roles/users/:userId — Get roles for a specific user
router.get('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    const roles = userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
      assignedAt: ur.assignedAt,
    }));

    res.json(roles);
  } catch (err) {
    next(err);
  }
});

// POST /api/roles/assign — Assign a role to a user
router.post('/assign', async (req, res, next) => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      return res.status(400).json({
        error: { message: 'userId and roleName are required', status: 400 },
      });
    }

    const user = await prisma.authUser.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', status: 404 },
      });
    }

    const role = await prisma.role.findFirst({ where: { name: roleName } });
    if (!role) {
      return res.status(404).json({
        error: { message: `Role "${roleName}" not found. Run seed:roles first.`, status: 404 },
      });
    }

    const existing = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (existing) {
      return res.status(409).json({
        error: { message: 'User already has this role', status: 409 },
      });
    }

    await prisma.userRole.create({
      data: { userId, roleId: role.id },
    });

    logger.info({ userId, roleName, assignedBy: req.user.id }, 'Role assigned');

    res.status(201).json({ message: `Role "${roleName}" assigned to user`, userId, roleName });
  } catch (err) {
    next(err);
  }
});

// POST /api/roles/revoke — Revoke a role from a user
router.post('/revoke', async (req, res, next) => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      return res.status(400).json({
        error: { message: 'userId and roleName are required', status: 400 },
      });
    }

    const role = await prisma.role.findFirst({ where: { name: roleName } });
    if (!role) {
      return res.status(404).json({
        error: { message: `Role "${roleName}" not found`, status: 404 },
      });
    }

    const existing = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (!existing) {
      return res.status(404).json({
        error: { message: 'User does not have this role', status: 404 },
      });
    }

    await prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId: role.id } },
    });

    logger.info({ userId, roleName, revokedBy: req.user.id }, 'Role revoked');

    res.json({ message: `Role "${roleName}" revoked from user`, userId, roleName });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
