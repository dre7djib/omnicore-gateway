const config = require('../config');
const { logger } = require('../config/logger');

const countryScope = (req, res, next) => {
  const permission = req.permission;

  if (!permission || !permission.countryScoped) {
    return next();
  }

  const userRoles = req.user?.roles || [];

  // Principal bypasses country scoping
  if (userRoles.includes('Principal')) {
    return next();
  }

  const userCountryId = req.user?.countryId;

  if (!userCountryId) {
    logger.warn({ userId: req.user?.id }, 'Tenant user has no countryId — denying scoped access');
    return res.status(403).json({
      error: { message: 'Forbidden — no country assigned to your account', status: 403 },
    });
  }

  const method = req.method.toUpperCase();

  // For POST: check body.countryId
  if (method === 'POST') {
    if (req.body && req.body.countryId && req.body.countryId !== userCountryId) {
      logger.warn({
        userId: req.user.id,
        bodyCountryId: req.body.countryId,
        userCountryId,
      }, 'Tenant attempting to create resource for another country');
      return res.status(403).json({
        error: { message: 'Forbidden — cannot create resources for another country', status: 403 },
      });
    }
    return next();
  }

  // For PUT/PATCH/DELETE: fetch the resource from product service to check countryId
  if (['PUT', 'PATCH', 'DELETE'].includes(method)) {
    const fullPath = req.originalUrl.split('?')[0];
    const resourceId = extractResourceId(fullPath);
    if (!resourceId) {
      return next();
    }

    // Build the canonical resource URL: strip any trailing non-UUID action
    // e.g. /api/country-products/:id/stock → /api/country-products/:id
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const segments = fullPath.split('/').filter(Boolean);
    const uuidIdx = segments.findIndex((s) => uuidPattern.test(s));
    const resourcePath = uuidIdx >= 0
      ? '/' + segments.slice(0, uuidIdx + 1).join('/')
      : fullPath;

    // Fetch from product service to verify country ownership
    const url = `${config.productServiceUrl}${resourcePath}`;
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': req.headers['x-correlation-id'] || '',
      },
    })
      .then((response) => {
        if (!response.ok) {
          return next();
        }
        return response.json();
      })
      .then((resource) => {
        if (!resource) {
          return next();
        }

        const resourceCountryId = resource.countryId || resource.country_id;

        if (resourceCountryId && resourceCountryId !== userCountryId) {
          logger.warn({
            userId: req.user.id,
            resourceCountryId,
            userCountryId,
          }, 'Tenant attempting to modify resource from another country');
          return res.status(403).json({
            error: { message: 'Forbidden — resource belongs to another country', status: 403 },
          });
        }
        next();
      })
      .catch((err) => {
        logger.error({ err }, 'Failed to verify country scope for resource');
        next();
      });
    return;
  }

  next();
};

const extractResourceId = (path) => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Search all segments so paths like /:id/stock still resolve the UUID
  for (const segment of path.split('/').filter(Boolean)) {
    if (uuidPattern.test(segment)) {
      return segment;
    }
  }
  return null;
};

module.exports = countryScope;
