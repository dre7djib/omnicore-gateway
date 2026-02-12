/**
 * Declarative role-permission mapping.
 * Deny-by-default: if a route/method combo is not listed here, it is denied.
 *
 * Each entry:
 *   method  — HTTP method (or '*' for all)
 *   pattern — RegExp tested against req.path
 *   roles   — which roles are allowed
 *   countryScoped — if true, Tenant writes are scoped to their country
 */

const permissions = [
  // ── Countries ──────────────────────────────────────────────
  { method: 'POST',   pattern: /^\/api\/countries\/?$/,           roles: ['Principal'],                 countryScoped: false },
  { method: 'GET',    pattern: /^\/api\/countries(\/.*)?$/,       roles: ['Principal', 'Tenant', 'User'], countryScoped: false },
  { method: 'PUT',    pattern: /^\/api\/countries\/[^/]+$/,       roles: ['Principal'],                 countryScoped: false },
  { method: 'DELETE', pattern: /^\/api\/countries\/[^/]+$/,       roles: ['Principal'],                 countryScoped: false },

  // ── Products ───────────────────────────────────────────────
  { method: 'POST',   pattern: /^\/api\/products\/?$/,           roles: ['Principal', 'Tenant'],       countryScoped: false },
  { method: 'GET',    pattern: /^\/api\/products(\/.*)?$/,       roles: ['Principal', 'Tenant', 'User'], countryScoped: false },
  { method: 'PUT',    pattern: /^\/api\/products\/[^/]+$/,       roles: ['Principal', 'Tenant'],       countryScoped: false },
  { method: 'PATCH',  pattern: /^\/api\/products\/[^/]+$/,       roles: ['Principal', 'Tenant'],       countryScoped: false },
  { method: 'DELETE', pattern: /^\/api\/products\/[^/]+$/,       roles: ['Principal'],                 countryScoped: false },

  // ── Product Images ─────────────────────────────────────────
  { method: 'POST',   pattern: /^\/api\/products\/[^/]+\/images\/?$/, roles: ['Principal', 'Tenant'], countryScoped: false },
  { method: 'DELETE', pattern: /^\/api\/products\/[^/]+\/images\/[^/]+$/, roles: ['Principal'],        countryScoped: false },

  // ── Country Products (stock/pricing) ───────────────────────
  { method: 'POST',   pattern: /^\/api\/country-products\/?$/,         roles: ['Principal', 'Tenant'], countryScoped: true },
  { method: 'GET',    pattern: /^\/api\/country-products(\/.*)?$/,     roles: ['Principal', 'Tenant', 'User'], countryScoped: false },
  { method: 'PUT',    pattern: /^\/api\/country-products\/[^/]+$/,     roles: ['Principal', 'Tenant'], countryScoped: true },
  { method: 'PATCH',  pattern: /^\/api\/country-products\/[^/]+$/,     roles: ['Principal', 'Tenant'], countryScoped: true },
  { method: 'DELETE', pattern: /^\/api\/country-products\/[^/]+$/,     roles: ['Principal', 'Tenant'], countryScoped: true },

  // ── Roles (gateway-local) ─────────────────────────────────
  { method: 'GET',    pattern: /^\/api\/roles\/?$/,               roles: ['Principal'],                 countryScoped: false },
  { method: 'GET',    pattern: /^\/api\/roles\/users\/[^/]+$/,    roles: ['Principal'],                 countryScoped: false },
  { method: 'POST',   pattern: /^\/api\/roles\/assign\/?$/,       roles: ['Principal'],                 countryScoped: false },
  { method: 'POST',   pattern: /^\/api\/roles\/revoke\/?$/,       roles: ['Principal'],                 countryScoped: false },
];

const findPermission = (method, path) => {
  const upperMethod = method.toUpperCase();
  return permissions.find(
    (p) => (p.method === '*' || p.method === upperMethod) && p.pattern.test(path),
  ) || null;
};

module.exports = { permissions, findPermission };
