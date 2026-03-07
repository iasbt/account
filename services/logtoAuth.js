import jwt from "jsonwebtoken";
import { createPublicKey } from "crypto";
import { config } from "../config/index.js";

let jwksCache = {
  expiresAt: 0,
  keys: []
};

const loadJwks = async () => {
  const jwksUrl = config.logto?.jwksUrl;
  if (!jwksUrl) return null;
  const now = Date.now();
  if (jwksCache.expiresAt > now && jwksCache.keys.length > 0) {
    return jwksCache;
  }
  try {
    const res = await fetch(jwksUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.keys)) return null;
    jwksCache = {
      expiresAt: now + 10 * 60 * 1000,
      keys: data.keys
    };
    return jwksCache;
  } catch (_error) {
    return null;
  }
};

const getVerificationKey = async (kid) => {
  const cache = await loadJwks();
  if (!cache) return null;
  const key = kid ? cache.keys.find((item) => item.kid === kid) : cache.keys[0];
  if (!key) return null;
  try {
    return createPublicKey({ key, format: "jwk" });
  } catch (_error) {
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

export const verifyAccessToken = async (token) => {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.payload) return null;
  const issuer = config.logto?.issuer;
  if (issuer && decoded.payload.iss !== issuer) return null;
  const key = await getVerificationKey(decoded.header?.kid);
  if (!key) return null;
  try {
    const payload = jwt.verify(token, key, {
      algorithms: ["ES384", "RS256", "PS256", "EdDSA"],
      issuer,
      audience: config.logto?.audience || undefined
    });
    if (payload.sub && !payload.id) payload.id = payload.sub;
    payload.isAdmin = resolveAdminFlag(payload);
    return payload;
  } catch (_error) {
    return null;
  }
};
