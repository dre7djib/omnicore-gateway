const { Router } = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const config = require('../config');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const countryScope = require('../middlewares/country-scope');

const router = Router();

const jsonParser = require('express').json();

const productProxy = createProxyMiddleware({
  target: config.productServiceUrl,
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody,
  },
});

// Restore req.url to the full originalUrl before handing off to the proxy,
// because Express strips the mount-point prefix from req.url.
const proxyForward = (req, res, next) => {
  req.url = req.originalUrl;
  productProxy(req, res, next);
};

// Country-products routes need country scoping
router.use(
  '/api/country-products',
  authenticate,
  authorize,
  jsonParser,
  countryScope,
  proxyForward,
);

// Countries
router.use(
  '/api/countries',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// Products (includes sub-routes like /api/products/:id/images)
router.use(
  '/api/products',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

module.exports = router;
