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
    proxyReq: fixRequestBody,
  },
});

// Strip /api prefix so the user service (which mounts at /users, /user-roles, etc.) resolves correctly.
const proxyForward = (req, res, next) => {
  req.url = req.originalUrl.replace(/^\/api/, '');
  userProxy(req, res, next);
};

// Users routes - authenticated and authorized
router.use(
  '/api/users',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// Roles routes
router.use(
  '/api/roles',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// User roles routes
router.use(
  '/api/user-roles',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// User addresses routes
router.use(
  '/api/user-addresses',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// User preferences routes
router.use(
  '/api/user-preferences',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// User audit logs routes
router.use(
  '/api/user-audit-logs',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

module.exports = router;
