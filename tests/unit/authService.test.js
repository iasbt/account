import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/authService.js';
import pool from '../../config/db.js';
import bcryptjs from 'bcryptjs';

// Mock dependencies
vi.mock('../../config/db.js', () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock('../../utils/email.js', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../utils/emailTemplates.js', () => ({
  getVerificationCodeTemplate: vi.fn().mockReturnValue('<html>mock template</html>'),
}));

vi.mock('../../utils/verificationStore.js', () => ({
  setVerificationCode: vi.fn(),
  getVerificationCode: vi.fn(),
  deleteVerificationCode: vi.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pool.query.mockReset();
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'testuser',
        email: 'test@example.com',
        password: '$2a$10$hashedpassword', // Mocked hash
        is_admin: false,
      };

      // Mock DB response
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [mockUser],
      });

      // Mock bcrypt compare
      vi.spyOn(bcryptjs, 'compare').mockResolvedValue(true);

      const result = await authService.login({ account: 'testuser', password: 'password' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM public.users'),
        ['testuser']
      );
      expect(result).toHaveProperty('token');
      expect(result.user).toMatchObject({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
      });
    });

    it('should throw error for non-existent user', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(authService.login({ account: 'unknown', password: 'password' }))
        .rejects.toThrow('账号或密码错误');
    });

    it('should throw error for wrong password', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'testuser',
        password: '$2a$10$hashedpassword',
      };

      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [mockUser] });
      vi.spyOn(bcryptjs, 'compare').mockResolvedValue(false);

      await expect(authService.login({ account: 'testuser', password: 'wrong' }))
        .rejects.toThrow('账号或密码错误');
    });
  });

  describe('adminLogin', () => {
    it('should throw error if user is not admin', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'normaluser',
        email: 'normal@example.com',
        password: '$2a$10$hashedpassword',
        is_admin: false,
      };

      pool.query.mockImplementation((text) => {
        if (text.includes("FROM public.users WHERE email = $1 OR name = $1")) {
          return Promise.resolve({ rowCount: 1, rows: [mockUser] });
        }
        if (text.includes("admin_accounts")) {
          return Promise.resolve({ rowCount: 0, rows: [] });
        }
        return Promise.resolve({ rowCount: 0, rows: [] });
      });

      await expect(authService.adminLogin({ account: 'normaluser', password: 'password', skipLockout: true }))
        .rejects.toThrow('无权访问');
    });

    it('should login successfully if user is admin', async () => {
      const adminPassword = "AdminPass123!";
      const mockAdmin = {
        id: 'admin-123',
        name: 'admin',
        email: 'admin@example.com',
        password: await bcryptjs.hash(adminPassword, 10),
        is_admin: true,
      };

      pool.query.mockImplementation((text) => {
        if (text.includes("FROM public.users WHERE email = $1 OR name = $1")) {
          return Promise.resolve({ rowCount: 1, rows: [mockAdmin] });
        }
        if (text.includes("FROM public.legacy_users WHERE email = $1 OR username = $1")) {
          return Promise.resolve({ rowCount: 0, rows: [] });
        }
        if (text.includes("admin_accounts")) {
          return Promise.resolve({ rowCount: 1, rows: [{ "?column?": 1 }] });
        }
        return Promise.resolve({ rowCount: 0, rows: [] });
      });

      vi.spyOn(bcryptjs, 'compare').mockResolvedValue(true);
      const result = await authService.adminLogin({ account: 'admin', password: adminPassword, skipLockout: true });

      expect(result.user.isAdmin).toBe(true);
      expect(result).toHaveProperty('token');
    });

    it('should login successfully if admin uses non-admin username', async () => {
      const adminPassword = "AdminPass123!";
      const mockAdmin = {
        id: 'admin-2',
        name: 'iasbt_admin',
        email: 'iasbt@outlook.com',
        password: await bcryptjs.hash(adminPassword, 10),
        is_admin: true,
      };

      pool.query.mockImplementation((text) => {
        if (text.includes("FROM public.users WHERE email = $1 OR name = $1")) {
          return Promise.resolve({ rowCount: 1, rows: [mockAdmin] });
        }
        if (text.includes("admin_accounts")) {
          return Promise.resolve({ rowCount: 1, rows: [{ "?column?": 1 }] });
        }
        if (text.includes("FROM public.legacy_users WHERE email = $1 OR username = $1")) {
          return Promise.resolve({ rowCount: 0, rows: [] });
        }
        return Promise.resolve({ rowCount: 0, rows: [] });
      });

      vi.spyOn(bcryptjs, 'compare').mockResolvedValue(true);
      const result = await authService.adminLogin({ account: 'iasbt_admin', password: adminPassword, skipLockout: true });

      expect(result.user.isAdmin).toBe(true);
      expect(result).toHaveProperty('token');
    });
  });
});
