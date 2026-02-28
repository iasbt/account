
import { APPLICATIONS } from "../config/apps.js";
import { config } from "../config/index.js";

/**
 * Validate if the redirect target is safe
 * @param {string} targetUrl 
 * @returns {boolean}
 */
export const isValidRedirectTarget = (targetUrl) => {
  if (!targetUrl) return false;

  try {
    const url = new URL(targetUrl);
    
    // 1. Check against config.allowedDomains (Suffix Match)
    // e.g. .iasbt.com matches sub.iasbt.com
    const isAllowedDomain = config.allowedDomains.some(domain => {
      if (domain.startsWith(".")) {
        return url.hostname.endsWith(domain) || url.hostname === domain.substring(1);
      }
      return url.hostname === domain;
    });

    if (isAllowedDomain) {
      return true;
    }

    // 2. Check against Registered Applications
    for (const app of Object.values(APPLICATIONS)) {
      if (app.allowedOrigins && Array.isArray(app.allowedOrigins)) {
        // Strict check: targetUrl must match one of the allowed origins/URLs
        // or be a sub-path of an allowed URL
        const matched = app.allowedOrigins.some(allowed => {
            // Exact match
            if (allowed === targetUrl) return true;
            
            // Origin match
            try {
                const allowedOrigin = new URL(allowed).origin;
                if (url.origin === allowedOrigin) return true;
            } catch (_e) {
                // ignore invalid allowed origin
            }
            
            return false;
        });
        
        if (matched) return true;
      }
    }

    return false;
  } catch (_e) {
    // Invalid URL format
    return false;
  }
};
