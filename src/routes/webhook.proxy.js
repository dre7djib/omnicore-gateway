const { Router } = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

const router = Router();

/**
 * Webhook proxy — forwards /webhooks/* to the payment service.
 *
 * IMPORTANT: No authenticate / authorize middleware here.
 * Stripe calls this endpoint directly — it does NOT send a JWT.
 * Signature verification happens inside the payment service using STRIPE_WEBHOOK_SECRET.
 *
 * IMPORTANT: No express.json() / fixRequestBody here.
 * The gateway does not parse the body globally, so the raw body passes through
 * untouched — which is exactly what Stripe's signature verification requires.
 */
const webhookProxy = createProxyMiddleware({
  target: config.paymentServiceUrl,
  changeOrigin: true,
});

const proxyForward = (req, res, next) => {
  req.url = req.originalUrl;
  webhookProxy(req, res, next);
};

/**
 * @swagger
 * tags:
 *   - name: Webhooks
 *     description: Stripe webhook receiver (no auth — called by Stripe)
 */

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     tags: [Webhooks]
 *     summary: Stripe webhook endpoint
 *     description: |
 *       Called automatically by Stripe. Do not call manually.
 *
 *       **Local testing with Stripe CLI:**
 *       ```bash
 *       stripe listen --forward-to http://localhost:3010/webhooks/stripe
 *       stripe trigger payment_intent.succeeded
 *       stripe trigger payment_intent.payment_failed
 *       ```
 *     responses:
 *       200:
 *         description: Event received
 *       400:
 *         description: Invalid Stripe signature
 */
router.use('/webhooks', proxyForward);

module.exports = router;
