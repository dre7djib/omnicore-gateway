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

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management — gateway-local, Principal only
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: List all available roles
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *       403:
 *         description: Forbidden — Principal role required
 */
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

/**
 * @swagger
 * /api/roles/users/{userId}:
 *   get:
 *     tags: [Roles]
 *     summary: Get all roles assigned to a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Roles assigned to the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Role'
 *                   - type: object
 *                     properties:
 *                       assignedAt: { type: string, format: date-time }
 *       403:
 *         description: Forbidden — Principal role required
 */
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

/**
 * @swagger
 * /api/roles/assign:
 *   post:
 *     tags: [Roles]
 *     summary: Assign a role to a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, roleName]
 *             properties:
 *               userId:   { type: string, format: uuid }
 *               roleName: { type: string, enum: [Principal, Tenant, User] }
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:  { type: string }
 *                 userId:   { type: string, format: uuid }
 *                 roleName: { type: string }
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User or role not found
 *       409:
 *         description: User already has this role
 *       403:
 *         description: Forbidden — Principal role required
 */
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

/**
 * @swagger
 * /api/roles/revoke:
 *   post:
 *     tags: [Roles]
 *     summary: Revoke a role from a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, roleName]
 *             properties:
 *               userId:   { type: string, format: uuid }
 *               roleName: { type: string, enum: [Principal, Tenant, User] }
 *     responses:
 *       200:
 *         description: Role revoked successfully
 *       404:
 *         description: User does not have this role
 *       403:
 *         description: Forbidden — Principal role required
 */
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
