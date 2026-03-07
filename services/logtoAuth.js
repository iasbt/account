import jwt from "jsonwebtoken";
import { createPublicKey } from "crypto";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

let jwksCache = {
  expiresAt: 0,
  keys: []
};

const fetchJwks = async (jwksUrl) => {
  try {
    const res = await fetch(jwksUrl);
    if (!res.ok) {
      logger.error({ event: "jwks_fetch_failed", status: res.status, url: jwksUrl });
      return null;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.keys)) {
      logger.error({ event: "jwks_invalid_format", data });
      return null;
    }
    return data.keys;
  } catch (error) {
    logger.error({ event: "jwks_fetch_error", error: error.message });
    return null;
  }
};

const loadJwks = async (forceRefresh = false) => {
  const jwksUrl = config.logto?.jwksUrl;
  if (!jwksUrl) return null;
  
  const now = Date.now();
  if (!forceRefresh && jwksCache.expiresAt > now && jwksCache.keys.length > 0) {
    return jwksCache;
  }

  const keys = await fetchJwks(jwksUrl);
  if (keys) {
    jwksCache = {
      expiresAt: now + 10 * 60 * 1000, // Cache for 10 minutes
      keys: keys
    };
    logger.info({ event: "jwks_refreshed", count: keys.length });
    return jwksCache;
  }
  
  return jwksCache.keys.length > 0 ? jwksCache : null; // Return stale cache if fetch fails
};

const getVerificationKey = async (kid) => {
  let cache = await loadJwks();
  if (!cache) return null;

  let key = kid ? cache.keys.find((item) => item.kid === kid) : cache.keys[0];

  // If key not found, try force refresh once
  if (!key && kid) {
    logger.warn({ event: "jwks_key_not_found", kid, action: "force_refresh" });
    cache = await loadJwks(true);
    if (cache) {
      key = cache.keys.find((item) => item.kid === kid);
    }
  }

  if (!key) {
    logger.error({ event: "jwks_key_missing_after_refresh", kid, availableKids: cache.keys.map(k => k.kid) });
    return null;
  }

  try {
    return createPublicKey({ key, format: "jwk" });
  } catch (error) {
    logger.error({ event: "jwks_key_creation_failed", error: error.message });
    return null;
  }
};

const resolveAdminFlag = (payload) => {
  if (payload?.isAdmin !== undefined) return payload.isAdmin;
  if (payload?.is_admin !== undefined) return payload.is_admin;
  const roles = Array.isArray(payload?.roles) ? payload.roles : [];
  const orgRoles = Array.isArray(payload?.organization_roles) ? payload.organization_roles : [];
  return roles.includes("admin") || orgRoles.some((role) => role.endsWith(":admin"));
};

const normalizeIssuer = (iss) => {
  return iss ? iss.replace(/\/$/, "") : "";
};

export const verifyAccessToken = async (token) => {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.payload) {
    logger.warn({ event: "token_decode_failed" });
    return null;
  }

  const configIssuer = normalizeIssuer(config.logto?.issuer);
  const tokenIssuer = normalizeIssuer(decoded.payload.iss);

  if (configIssuer && tokenIssuer !== configIssuer) {
    logger.warn({ event: "token_issuer_mismatch", expected: configIssuer, received: tokenIssuer });
    return null;
  }

  const key = await getVerificationKey(decoded.header?.kid);
  if (!key) return null;

  try {
    const payload = jwt.verify(token, key, {
      algorithms: ["ES384", "RS256", "PS256", "EdDSA"],
      // Use the normalized issuer logic via a custom check or rely on previous check if strict
      // Here we trust the previous check and pass the raw token issuer to avoid verify failure on slash mismatch if lib is strict
      issuer: decoded.payload.iss, 
      audience: config.logto?.audience || undefined
    });

    if (payload.sub && !payload.id) payload.id = payload.sub;
    payload.isAdmin = resolveAdminFlag(payload);
    return payload;
  } catch (error) {
    logger.error({ event: "token_verification_failed", error: error.message });
    return null;
  }
};
