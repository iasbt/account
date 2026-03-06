import { describe, it, expect } from 'vitest';
import { isValidRedirectTarget } from '../../utils/redirectValidator.js';

describe('Redirect Validator', () => {
  it('should allow whitelisted domains', () => {
    // Assuming config.allowedDomains includes 'iasbt.com' or similar
    // We can't easily mock config here without vi.mock, but let's test the logic based on known defaults
    // If config is imported directly, we rely on its current state.
    // Ideally we should mock config.
    
    // For now, let's test the logic we know exists in the function
    expect(isValidRedirectTarget('https://account.iasbt.cloud')).toBe(true);
  });

  it('should allow app origins', () => {
    // Assuming Gallery is registered
    expect(isValidRedirectTarget('https://gallery.iasbt.com/callback')).toBe(true);
  });

  it('should reject external domains', () => {
    expect(isValidRedirectTarget('https://evil.com')).toBe(false);
  });

  it('should reject domains that just end with whitelist string but are different domains', () => {
    expect(isValidRedirectTarget('https://evil-iasbt.com')).toBe(false);
    expect(isValidRedirectTarget('https://iasbt.com.evil.com')).toBe(false);
  });

  it('should reject javascript: protocols', () => {
    expect(isValidRedirectTarget('javascript:alert(1)')).toBe(false);
  });

  it('should handle invalid URLs gracefully', () => {
    expect(isValidRedirectTarget('not-a-url')).toBe(false);
  });
});
