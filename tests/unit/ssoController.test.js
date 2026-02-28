import { describe, it, expect, vi, beforeEach } from 'vitest';
import { token } from '../../controllers/ssoController.js';
import pool from '../../config/db.js';
import * as oauth from '../../utils/oauth.js';
import * as tokenUtils from '../../utils/token.js';

// Mock dependencies
vi.mock('../../config/db.js', () => ({
  default: {
    query: vi.fn()
  }
}));

vi.mock('../../utils/oauth.js', () => ({
  getAuthCode: vi.fn(),
  invalidateAuthCode: vi.fn(),
  verifyPkce: vi.fn()
}));

vi.mock('../../utils/token.js', () => ({
  signToken: vi.fn(),
  verifyToken: vi.fn()
}));

vi.mock('../../services/auditLogger.js', () => ({
  auditLogger: {
    log: vi.fn()
  },
  AuditEvent: {
    SSO_AUTH: 'SSO_AUTH'
  }
}));

vi.mock('../../config/index.js', () => ({
  config: {
    ssoTokenTtl: 300
  }
}));

describe('SSO Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 'user-123' } // Only for authorize, but token endpoint uses body
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
    vi.clearAllMocks();
  });

  describe('token endpoint', () => {
    it('should exchange authorization code for tokens correctly', async () => {
      const client_id = 'test-client';
      const redirect_uri = 'https://client.com/cb';
      const code = 'valid-code';
      const user_id = 'user-123';
      
      req.body = {
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id
      };

      // Mock DB: Application lookup (first query)
      // Since the code does pool.query inside token function first
      pool.query.mockResolvedValueOnce({ 
        rowCount: 1, 
        rows: [{ app_id: client_id, secret: null }] 
      });

      // Mock getAuthCode
      oauth.getAuthCode.mockResolvedValue({
        client_id,
        redirect_uri,
        user_id,
        scope: 'profile'
      });

      // Mock DB: User lookup (inside issueTokens - second query)
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: user_id, name: 'Test User', email: 'test@example.com' }]
      });

      // Mock DB: Store Refresh Token (inside issueTokens - third query)
      pool.query.mockResolvedValueOnce({ rowCount: 1 });

      // Mock token signing
      tokenUtils.signToken.mockReturnValue('mock-access-token');

      await token(req, res);

      // Verify that issueTokens was called and used req, res correctly
      // Since issueTokens is internal, we check the side effects (res.json called with tokens)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        access_token: 'mock-access-token',
        token_type: 'Bearer'
      }));
    });
  });
});
