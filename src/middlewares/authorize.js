const { findPermission } = require('../permissions/rbac');
const { logger } = require('../config/logger');

const authorize = (req, res, next) => {
  const method = req.method;
  // Use originalUrl because Express strips the mount prefix from req.path
  const path = req.originalUrl.split('?')[0];
  const userRoles = req.user?.roles || [];

  const permission = findPermission(method, path);

  if (!permission) {
    logger.warn({ method, path }, 'No permission rule found — denied by default');
    return res.status(403).json({
      error: { message: 'Forbidden', status: 403 },
    });
  }

  const hasRole = permission.roles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    logger.warn({ method, path, userRoles, requiredRoles: permission.roles }, 'Insufficient role');
    return res.status(403).json({
      error: { message: 'Forbidden — insufficient permissions', status: 403 },
    });
  }

  req.permission = permission;
  next();
};

module.exports = authorize;
