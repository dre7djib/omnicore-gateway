const { Router } = require('express');

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Gateway health check
 *     security: []
 *     responses:
 *       200:
 *         description: Gateway is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:        { type: string, example: OK }
 *                 service:       { type: string, example: omnicore-gateway }
 *                 correlationId: { type: string }
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'omnicore-gateway',
    correlationId: req.correlationId ? req.correlationId() : undefined,
  });
});

module.exports = router;
