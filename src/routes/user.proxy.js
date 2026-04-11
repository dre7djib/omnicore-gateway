const { Router } = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const config = require('../config');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = Router();

const jsonParser = require('express').json();

const userProxy = createProxyMiddleware({
  target: config.userServiceUrl,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.removeHeader('X-Internal-Service-Token');
      if (config.internalServiceToken) {
        proxyReq.setHeader('X-Internal-Service-Token', config.internalServiceToken);
      }
      fixRequestBody(proxyReq, req, res);
    },
  },
});

// Strip /api prefix so the user service (which mounts at /users, /user-roles, etc.) resolves correctly.
const proxyForward = (req, res, next) => {
  req.url = req.originalUrl.replace(/^\/api/, '');
  userProxy(req, res, next);
};

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User profiles — proxied to omnicore-user service
 *   - name: User Roles
 *     description: User role assignments — proxied to omnicore-user service
 *   - name: User Addresses
 *     description: User addresses — proxied to omnicore-user service
 *   - name: User Preferences
 *     description: User preferences — proxied to omnicore-user service
 *   - name: User Audit Logs
 *     description: User audit logs — proxied to omnicore-user service
 */

// ── Users ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user profile (Principal only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User profile created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   get:
 *     tags: [Users]
 *     summary: List all user profiles (Principal, Tenant)
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user profile by ID (Principal, Tenant)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Users]
 *     summary: Update a user profile (Principal only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               country_id:   { type: string, format: uuid }
 *               first_name:   { type: string }
 *               last_name:    { type: string }
 *               phone_number: { type: string }
 *               status:       { type: string }
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user profile (Principal only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.use(
  '/api/users',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// ── User Roles ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/user-roles:
 *   post:
 *     tags: [User Roles]
 *     summary: Assign a role to a user (Principal only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, role_id]
 *             properties:
 *               user_id:     { type: string, format: uuid }
 *               role_id:     { type: string, format: uuid }
 *               assigned_at: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Role assigned
 *   get:
 *     tags: [User Roles]
 *     summary: List all user-role assignments (Principal only)
 *     responses:
 *       200:
 *         description: List of user-role assignments
 */

/**
 * @swagger
 * /api/user-roles/{userId}:
 *   get:
 *     tags: [User Roles]
 *     summary: Get role assignment for a specific user (Principal only)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User role assignment
 *   put:
 *     tags: [User Roles]
 *     summary: Update a user-role assignment (Principal only)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_id:     { type: string, format: uuid }
 *               assigned_at: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [User Roles]
 *     summary: Remove a role from a user (Principal only)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Removed
 */
router.use(
  '/api/user-roles',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// ── User Addresses ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/user-addresses:
 *   post:
 *     tags: [User Addresses]
 *     summary: Create a user address (all roles)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:     { type: string, format: uuid }
 *               country_id:  { type: string, format: uuid }
 *               street:      { type: string, example: "12 Rue de Rivoli" }
 *               city:        { type: string, example: Paris }
 *               postal_code: { type: string, example: "75001" }
 *               is_primary:  { type: boolean }
 *     responses:
 *       201:
 *         description: Address created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAddress'
 *   get:
 *     tags: [User Addresses]
 *     summary: List all addresses (all roles)
 *     responses:
 *       200:
 *         description: List of addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserAddress'
 */

/**
 * @swagger
 * /api/user-addresses/{id}:
 *   get:
 *     tags: [User Addresses]
 *     summary: Get an address by ID (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAddress'
 *   put:
 *     tags: [User Addresses]
 *     summary: Update an address (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:        { type: string }
 *               postal_code: { type: string }
 *               street:      { type: string }
 *               is_primary:  { type: boolean }
 *     responses:
 *       200:
 *         description: Updated address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAddress'
 *   delete:
 *     tags: [User Addresses]
 *     summary: Delete an address (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.use(
  '/api/user-addresses',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// ── User Preferences ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/user-preferences:
 *   post:
 *     tags: [User Preferences]
 *     summary: Create user preferences (all roles)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:               { type: string, format: uuid }
 *               language:              { type: string, example: fr }
 *               timezone:              { type: string, example: Europe/Paris }
 *               notifications_enabled: { type: boolean }
 *     responses:
 *       201:
 *         description: Preferences created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPreference'
 *   get:
 *     tags: [User Preferences]
 *     summary: List all preferences (all roles)
 *     responses:
 *       200:
 *         description: List of preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserPreference'
 */

/**
 * @swagger
 * /api/user-preferences/{id}:
 *   get:
 *     tags: [User Preferences]
 *     summary: Get preferences by ID (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Preferences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPreference'
 *   put:
 *     tags: [User Preferences]
 *     summary: Update preferences (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:              { type: string }
 *               timezone:              { type: string }
 *               notifications_enabled: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated preferences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPreference'
 *   delete:
 *     tags: [User Preferences]
 *     summary: Delete preferences (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.use(
  '/api/user-preferences',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// ── User Audit Logs ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/user-audit-logs:
 *   post:
 *     tags: [User Audit Logs]
 *     summary: Create an audit log entry (Principal only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, action]
 *             properties:
 *               user_id:      { type: string, format: uuid }
 *               action:       { type: string, example: USER_PROFILE_UPDATED }
 *               performed_by: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Audit log created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAuditLog'
 *   get:
 *     tags: [User Audit Logs]
 *     summary: List all audit logs (Principal only)
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserAuditLog'
 */

/**
 * @swagger
 * /api/user-audit-logs/{id}:
 *   get:
 *     tags: [User Audit Logs]
 *     summary: Get an audit log by ID (Principal only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Audit log entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAuditLog'
 *   put:
 *     tags: [User Audit Logs]
 *     summary: Update an audit log (Principal only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserAuditLog'
 *   delete:
 *     tags: [User Audit Logs]
 *     summary: Delete an audit log (Principal only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.use(
  '/api/user-audit-logs',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

module.exports = router;
