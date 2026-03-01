const { Router } = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const config = require('../config');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = Router();

const jsonParser = require('express').json();

const orderProxy = createProxyMiddleware({
  target: config.orderServiceUrl,
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody,
  },
});

// Restore req.url to the full originalUrl before handing off to the proxy,
// because Express strips the mount-point prefix from req.url.
const proxyForward = (req, res, next) => {
  req.url = req.originalUrl;
  orderProxy(req, res, next);
};

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order lifecycle management — proxied to omnicore-order service
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order (Principal, Tenant, User)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, countryId, items]
 *             properties:
 *               userId:    { type: string, format: uuid }
 *               countryId: { type: string, format: uuid }
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [countryProductId, quantity]
 *                   properties:
 *                     countryProductId: { type: string, format: uuid }
 *                     quantity:         { type: integer, minimum: 1, example: 2 }
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Insufficient stock or invalid country
 *   get:
 *     tags: [Orders]
 *     summary: List orders (all roles)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *         description: Filter by user ID
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, confirmed, shipped, delivered, cancelled] }
 *         description: Filter by status
 *       - in: query
 *         name: countryId
 *         schema: { type: string, format: uuid }
 *         description: Filter by country ID
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order by ID (all roles)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *   delete:
 *     tags: [Orders]
 *     summary: Delete an order (Principal, Tenant, User)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (Principal, Tenant only)
 *     security:
 *       - bearerAuth: []
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [confirmed, shipped, delivered, cancelled] }
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User role cannot update status)
 *       422:
 *         description: Invalid status transition
 */
router.use(
  '/api/orders',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

module.exports = router;
