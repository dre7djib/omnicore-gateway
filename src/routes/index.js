const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authProxy = require('./auth.proxy');
const productProxy = require('./product.proxy');
const rolesRoutes = require('./roles.routes');

const router = Router();

// Health check — no auth
router.use(healthRoutes);

// Auth proxy — public signup/login/refresh, authenticated logout
router.use(authProxy);

// Roles — gateway-local, Principal only
router.use('/api/roles', rolesRoutes);

// Product proxy — authenticated + authorized + country-scoped
router.use(productProxy);

module.exports = router;
