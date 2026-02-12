jest.mock('../../../src/config', () => ({
  productServiceUrl: 'http://localhost:3001',
}));

jest.mock('../../../src/config/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

const countryScope = require('../../../src/middlewares/country-scope');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('countryScope middleware', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call next() if permission is not countryScoped', () => {
    const req = {
      permission: { countryScoped: false },
      user: { roles: ['Tenant'], countryId: 'c-1' },
    };
    const res = mockRes();
    const next = jest.fn();

    countryScope(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next() if no permission object', () => {
    const req = { user: { roles: ['Tenant'], countryId: 'c-1' } };
    const res = mockRes();
    const next = jest.fn();

    countryScope(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should bypass scoping for Principal', () => {
    const req = {
      permission: { countryScoped: true },
      user: { roles: ['Principal'], countryId: null },
      method: 'POST',
      body: { countryId: 'c-99' },
    };
    const res = mockRes();
    const next = jest.fn();

    countryScope(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should deny Tenant with no countryId', () => {
    const req = {
      permission: { countryScoped: true },
      user: { id: 'u-1', roles: ['Tenant'], countryId: null },
      method: 'POST',
      body: { countryId: 'c-1' },
    };
    const res = mockRes();
    const next = jest.fn();

    countryScope(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should deny Tenant POST with mismatched countryId', () => {
    const req = {
      permission: { countryScoped: true },
      user: { id: 'u-1', roles: ['Tenant'], countryId: 'c-1' },
      method: 'POST',
      body: { countryId: 'c-other' },
    };
    const res = mockRes();
    const next = jest.fn();

    countryScope(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Forbidden — cannot create resources for another country', status: 403 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow Tenant POST with matching countryId', () => {
    const req = {
      permission: { countryScoped: true },
      user: { id: 'u-1', roles: ['Tenant'], countryId: 'c-1' },
      method: 'POST',
      body: { countryId: 'c-1' },
    };
    const res = mockRes();
    const next = jest.fn();

    countryScope(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should fetch resource for PUT and deny if countryId mismatches', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cp-1', countryId: 'c-other' }),
    });

    const req = {
      permission: { countryScoped: true },
      user: { id: 'u-1', roles: ['Tenant'], countryId: 'c-1' },
      method: 'PUT',
      originalUrl: '/api/country-products/550e8400-e29b-41d4-a716-446655440000',
      headers: {},
    };
    const res = mockRes();
    const next = jest.fn();

    countryScope(req, res, next);

    // Wait for async fetch to resolve
    await new Promise((r) => setTimeout(r, 50));

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow Tenant PUT if resource countryId matches', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cp-1', countryId: 'c-1' }),
    });

    const req = {
      permission: { countryScoped: true },
      user: { id: 'u-1', roles: ['Tenant'], countryId: 'c-1' },
      method: 'PUT',
      originalUrl: '/api/country-products/550e8400-e29b-41d4-a716-446655440000',
      headers: {},
    };
    const res = mockRes();
    const next = jest.fn();

    countryScope(req, res, next);

    await new Promise((r) => setTimeout(r, 50));

    expect(next).toHaveBeenCalled();
  });
});
