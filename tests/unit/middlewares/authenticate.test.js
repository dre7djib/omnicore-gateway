const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test-jwt-secret';

// Mock config before requiring authenticate
jest.mock('../../../src/config', () => ({
  jwtSecret: TEST_SECRET,
}));

jest.mock('../../../src/config/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

const authenticate = require('../../../src/middlewares/authenticate');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  it('should return 401 if no Authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Missing or malformed Authorization header', status: 401 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header is not Bearer', () => {
    const req = { headers: { authorization: 'Basic abc123' } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Invalid token', status: 401 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired', () => {
    const token = jwt.sign(
      { sub: 'user-1', email: 'a@b.com', roles: ['User'], countryId: null },
      TEST_SECRET,
      { expiresIn: '-1s' },
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Token expired', status: 401 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach req.user and call next() with valid token', () => {
    const payload = { sub: 'user-1', email: 'a@b.com', roles: ['Principal'], countryId: 'c-1' };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 'user-1',
      email: 'a@b.com',
      roles: ['Principal'],
      countryId: 'c-1',
    });
  });

  it('should default roles to [] and countryId to null if missing', () => {
    const token = jwt.sign({ sub: 'user-2', email: 'b@c.com' }, TEST_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.roles).toEqual([]);
    expect(req.user.countryId).toBeNull();
  });
});
