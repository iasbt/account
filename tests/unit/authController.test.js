import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logout } from '../../controllers/authController.js';
import * as redis from '../../utils/redis.js';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../../utils/redis.js', () => ({
  addToBlacklist: vi.fn(),
  getRedisClient: vi.fn()
}));

vi.mock('../../utils/email.js', () => ({
  sendEmail: vi.fn()
}));

vi.mock('../../utils/emailQueue.js', () => ({
  addEmailJob: vi.fn()
}));

vi.mock('../../services/auditLogger.js', () => ({
  auditLogger: {
    log: vi.fn()
  },
  AuditEvent: {
    LOGOUT: 'LOGOUT'
  }
}));

vi.mock('../../config/index.js', () => ({
  config: {
    ssoSecret: 'test-secret',
    allowedDomains: ['example.com'],
    redis: {
      host: 'localhost',
      port: 6379
    }
  }
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn()
  }
}));

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      headers: {},
      query: {},
      body: {}
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      redirect: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('logout', () => {
    it('should add token to blacklist if present', async () => {
      const token = 'valid-token';
      req.headers.authorization = `Bearer ${token}`;
      
      // Mock jwt.verify to return a valid payload
      jwt.verify.mockReturnValue({ 
        id: 'user-123', 
        exp: Math.floor(Date.now() / 1000) + 3600 // expires in 1 hour
      });

      await logout(req, res);

      expect(redis.addToBlacklist).toHaveBeenCalledWith(token, expect.any(Number));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle missing token gracefully', async () => {
      req.headers.authorization = undefined;
      await logout(req, res);
      expect(redis.addToBlacklist).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle token verification failure gracefully', async () => {
      const token = 'invalid-token';
      req.headers.authorization = `Bearer ${token}`;
      
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await logout(req, res);

      expect(redis.addToBlacklist).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
