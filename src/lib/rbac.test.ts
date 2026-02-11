import { describe, it, expect } from 'vitest';
import { hasPermission, hasAnyPermission, ROLE_PERMISSIONS } from './rbac';
import type { CasdoorUser } from '../store/useAuthStore';

describe('RBAC System', () => {
  // Mock Users
  const adminUser: CasdoorUser = {
    id: '1',
    name: 'admin',
    displayName: 'Admin',
    avatar: '',
    email: 'admin@example.com',
    isAdmin: true
  };

  const normalUser: CasdoorUser = {
    id: '2',
    name: 'user',
    displayName: 'User',
    avatar: '',
    email: 'user@example.com',
    isAdmin: false
  };

  const guestUser = null;

  describe('Permission Matrix Integrity', () => {
    it('should have defined permissions for all roles', () => {
      expect(ROLE_PERMISSIONS.admin).toBeDefined();
      expect(ROLE_PERMISSIONS.user).toBeDefined();
      expect(ROLE_PERMISSIONS.guest).toBeDefined();
    });

    it('admin should have manage:system permission', () => {
      expect(ROLE_PERMISSIONS.admin).toContain('manage:system');
    });

    it('user should NOT have manage:system permission', () => {
      expect(ROLE_PERMISSIONS.user).not.toContain('manage:system');
    });
  });

  describe('hasPermission Logic', () => {
    it('should return true for admin accessing system', () => {
      expect(hasPermission(adminUser, 'manage:system')).toBe(true);
    });

    it('should return false for normal user accessing system', () => {
      expect(hasPermission(normalUser, 'manage:system')).toBe(false);
    });

    it('should return true for normal user accessing dashboard', () => {
      expect(hasPermission(normalUser, 'view:dashboard')).toBe(true);
    });

    it('should return false for guest accessing dashboard', () => {
      expect(hasPermission(guestUser, 'view:dashboard')).toBe(false);
    });
  });

  describe('hasAnyPermission Logic', () => {
    it('should return true if user has at least one permission', () => {
      // User has view:dashboard but not manage:system
      expect(hasAnyPermission(normalUser, ['manage:system', 'view:dashboard'])).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(hasAnyPermission(normalUser, ['manage:system', 'manage:users'])).toBe(false);
    });
  });
});
