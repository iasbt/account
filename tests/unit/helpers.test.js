import { describe, it, expect } from 'vitest';
import { isOriginAllowed, isHostAllowed, redactHeaders } from '../../utils/helpers.js';

describe('Helper Utilities', () => {
  describe('isOriginAllowed', () => {
    const allowlist = [
      'https://example.com',
      'http://localhost:3000',
      '*.iasbt.com'
    ];

    it('should allow exact matches', () => {
      expect(isOriginAllowed('https://example.com', allowlist)).toBe(true);
      expect(isOriginAllowed('http://localhost:3000', allowlist)).toBe(true);
    });

    it('should deny non-matching origins', () => {
      expect(isOriginAllowed('https://evil.com', allowlist)).toBe(false);
      expect(isOriginAllowed('http://localhost:4000', allowlist)).toBe(false);
    });

    it('should handle wildcards correctly', () => {
      // Logic in helpers.js uses simple regex replacement for *
      // let's test what it supports based on implementation
      // if (allowed.includes("*")) ...
      expect(isOriginAllowed('https://sub.iasbt.com', allowlist)).toBe(true);
      expect(isOriginAllowed('https://nested.sub.iasbt.com', allowlist)).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isOriginAllowed('not-a-url', allowlist)).toBe(false);
    });
  });

  describe('isHostAllowed', () => {
    const allowlist = ['example.com'];

    it('should allow exact host match', () => {
      expect(isHostAllowed('example.com', allowlist)).toBe(true);
    });

    it('should allow subdomains if implemented (based on endsWith logic)', () => {
      // Implementation: host.endsWith(`.${item}`)
      expect(isHostAllowed('sub.example.com', allowlist)).toBe(true);
    });

    it('should deny other hosts', () => {
      expect(isHostAllowed('google.com', allowlist)).toBe(false);
    });

    it('should fall back to defaults if allowlist is empty', () => {
      expect(isHostAllowed('iasbt.com', [])).toBe(true);
      expect(isHostAllowed('sub.iasbt.com', [])).toBe(true);
      expect(isHostAllowed('localhost', [])).toBe(true);
      expect(isHostAllowed('127.0.0.1', [])).toBe(true);
      expect(isHostAllowed('evil.com', [])).toBe(false);
    });
  });

  describe('redactHeaders', () => {
    it('should redact authorization header', () => {
      const headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer secret-token',
        'Authorization': 'Bearer secret-token-2' // Check case sensitivity handling in implementation
      };
      
      const redacted = redactHeaders(headers);
      expect(redacted['authorization']).toBe('[redacted]');
      // Implementation check: if (key.toLowerCase() === "authorization")
      // It iterates entries. If original key was "Authorization", it puts "Authorization" in result?
      // let's see: result[key] = "[redacted]"
      // So it preserves key case but changes value.
      expect(redacted['Authorization']).toBe('[redacted]');
      expect(redacted['content-type']).toBe('application/json');
    });
  });
});
