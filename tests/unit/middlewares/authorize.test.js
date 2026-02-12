jest.mock('../../../src/config/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

const authorize = require('../../../src/middlewares/authorize');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authorize middleware', () => {
  it('should return 403 for unmapped route (deny-by-default)', () => {
    const req = {
      method: 'DELETE',
      originalUrl: '/api/unknown-route',
      user: { roles: ['Principal'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Forbidden', status: 403 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user has no matching role', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/countries',
      user: { roles: ['User'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Forbidden — insufficient permissions', status: 403 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow Principal to POST /api/countries', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/countries',
      user: { roles: ['Principal'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.permission).toBeDefined();
  });

  it('should allow User to GET /api/products', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/products',
      user: { roles: ['User'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should allow Tenant to POST /api/products', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/products',
      user: { roles: ['Tenant'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should deny Tenant from DELETE /api/products/:id', () => {
    const req = {
      method: 'DELETE',
      originalUrl: '/api/products/some-uuid',
      user: { roles: ['Tenant'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should deny User from POST /api/roles/assign', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/roles/assign',
      user: { roles: ['User'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow Principal to POST /api/roles/assign', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/roles/assign',
      user: { roles: ['Principal'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should mark country-products POST as countryScoped', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/country-products',
      user: { roles: ['Tenant'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.permission.countryScoped).toBe(true);
  });

  it('should allow GET /api/country-products for User (not country-scoped)', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/country-products',
      user: { roles: ['User'] },
    };
    const res = mockRes();
    const next = jest.fn();

    authorize(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.permission.countryScoped).toBe(false);
  });
});
