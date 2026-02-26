import { APPLICATIONS } from "../config/apps.js";

// Collect all allowed origins from config
const STATIC_ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "http://119.91.71.30:5173",
  "http://119.91.71.30",
  "https://account.iasbt.com"
]);

// Add origins from APPLICATIONS config
Object.values(APPLICATIONS).forEach(app => {
  if (app.allowedOrigins) {
    app.allowedOrigins.forEach(origin => STATIC_ALLOWED_ORIGINS.add(origin));
  }
});

/**
 * Validate if the redirect target is safe
 * @param {string} targetUrl 
 * @returns {boolean}
 */
export const isValidRedirectTarget = (targetUrl) => {
  if (!targetUrl) return false;

  try {
    const url = new URL(targetUrl);
    const origin = url.origin;

    // 1. Check against static allowlist and config apps
    if (STATIC_ALLOWED_ORIGINS.has(origin)) {
      return true;
    }

    // 2. Allow all subdomains of iasbt.com (Production)
    if (url.hostname.endsWith(".iasbt.com")) {
      return true;
    }

    // 3. Allow localhost with any port (Development)
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return true;
    }

    // 4. Check if the full URL matches any specific allowed origin (for cases where allowedOrigins contains full URLs)
    // Note: The config seems to have full URLs in some cases, but mostly origins.
    // Let's re-check the logic in config/apps.js: matchAppByOrigin does `allowed === origin || allowed === targetUrl`
    for (const app of Object.values(APPLICATIONS)) {
        if (app.allowedOrigins.some(allowed => allowed === origin || allowed === targetUrl)) {
            return true;
        }
    }

    return false;
  } catch (e) {
    return false;
  }
};
