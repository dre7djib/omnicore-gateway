const { Router } = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const config = require('../config');
const authenticate = require('../middlewares/authenticate');
const { authLimiter } = require('../middlewares/rate-limit');

const router = Router();

const jsonParser = require('express').json();

const authProxy = createProxyMiddleware({
  target: config.authServiceUrl,
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody,
  },
});

// Restore req.url to the full originalUrl before handing off to the proxy,
// because Express strips the mount-point prefix from req.url.
const proxyForward = (req, res, next) => {
  req.url = req.originalUrl;
  authProxy(req, res, next);
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication — proxied to omnicore-auth service
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupInput'
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignupResponse'
 *       400:
 *         description: Validation error
 */
router.post('/auth/signup', authLimiter, jsonParser, proxyForward);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/login', authLimiter, jsonParser, proxyForward);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using a refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string, format: uuid }
 *                 expiresIn:   { type: string, example: 15m }
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/auth/refresh', authLimiter, jsonParser, proxyForward);

/**
 * @swagger
 * /auth/validate:
 *   post:
 *     tags: [Auth]
 *     summary: Validate a JWT and return its decoded payload
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:   { type: boolean }
 *                 payload: { type: object }
 *       401:
 *         description: Invalid or expired token
 */
router.post('/auth/validate', jsonParser, proxyForward);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and invalidate the refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *       401:
 *         description: Missing or invalid token
 */
router.post('/auth/logout', jsonParser, authenticate, proxyForward);

module.exports = router;
