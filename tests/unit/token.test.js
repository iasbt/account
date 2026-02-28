import { describe, it, expect, vi } from 'vitest';
import * as tokenUtils from '../../utils/token.js';
// We need to mock the config module to control the secret
vi.mock('../../config/index.js', () => ({
  config: {
    ssoSecret: 'test-secret-key-123456',
    ssoTokenTtl: 300,
    jwt: {
      algorithm: 'HS256'
    }
  }
}));

describe('Token Utility', () => {
  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false
  };

  const secret = 'test-secret-key-123456';

  describe('signToken & verifyToken', () => {
    it('should sign and verify a token correctly', async () => {
      const payload = { foo: 'bar' };
      // Explicitly passing secret
      const token = tokenUtils.signToken(payload, 3600, secret);
      expect(token).toBeDefined();
      
      const decoded = await tokenUtils.verifyToken(token, secret);
      expect(decoded).toMatchObject(payload);
    });
  });

  describe('generateToken', () => {
    it('should generate a standard auth token using default config secret', async () => {
      const token = tokenUtils.generateToken(mockUser);
      expect(token).toBeDefined();
      
      const decoded = await tokenUtils.verifyToken(token, secret);
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });
  });

});
