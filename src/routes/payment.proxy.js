const { Router } = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const config = require('../config');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = Router();
const jsonParser = require('express').json();

const paymentProxy = createProxyMiddleware({
  target: config.paymentServiceUrl,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      // Forward authenticated user ID to payment service
      if (req.user && req.user.id) {
        proxyReq.setHeader('X-User-Id', req.user.id);
      }
      fixRequestBody(proxyReq, req);
    },
  },
});

const proxyForward = (req, res, next) => {
  req.url = req.originalUrl;
  paymentProxy(req, res, next);
};

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Stripe payment processing — proxied to omnicore-payment service
 */

/**
 * @swagger
 * /api/payments/intent:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Stripe PaymentIntent for an order (all roles)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: PaymentIntent created — use stripeClientSecret with Stripe.js
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Order not found
 *       409:
 *         description: Payment already exists for this order
 *       422:
 *         description: Order not in pending status
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: List payments (Principal, Tenant)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, processing, succeeded, failed, cancelled, refunded] }
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get the payment for a specific order (Principal, Tenant)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Payment found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: No payment for this order
 */

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID (Principal, Tenant)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Payment found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Issue a full refund (Principal only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundInput'
 *     responses:
 *       200:
 *         description: Refund issued
 *       422:
 *         description: Payment not in succeeded status
 */
router.use('/api/payments', authenticate, authorize, jsonParser, proxyForward);

module.exports = router;
