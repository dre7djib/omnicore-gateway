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

// Public routes — no auth required
router.post('/auth/signup', authLimiter, jsonParser, proxyForward);
router.post('/auth/login', authLimiter, jsonParser, proxyForward);
router.post('/auth/refresh', authLimiter, jsonParser, proxyForward);

// Authenticated route
router.post('/auth/logout', jsonParser, authenticate, proxyForward);

module.exports = router;
