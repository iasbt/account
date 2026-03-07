import { config } from "../config/index.js";
import { parseOrigins, isOriginAllowed, defaultAllowlist } from "../utils/helpers.js";
import { logger } from "../utils/logger.js";

const originAllowlist = parseOrigins(config.corsAllowlist);
const effectiveAllowlist = originAllowlist.length > 0 ? originAllowlist : defaultAllowlist;

const normalizeOrigin = (/** @type {string} */ value) => (value || "").trim().replace(/\/+$/, "");

const isSameOrigin = (/** @type {string} */ origin, /** @type {import("express").Request} */ req) => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;
  const host = req.headers.host;
  if (!host) return false;
  const forwardedProto = (req.headers["x-forwarded-proto"] || "").toString().split(",")[0].trim();
  const protocol = forwardedProto || req.protocol || "http";
  return normalizedOrigin === `${protocol}://${host}`;
};

export const corsMiddleware = (/** @type {import("express").Request} */ req, /** @type {import("express").Response} */ res, /** @type {import("express").NextFunction} */ next) => {
  const origin = req.headers.origin;
  const allowedByAllowlist = origin && isOriginAllowed(origin, effectiveAllowlist);
  const allowedBySameOrigin = origin && isSameOrigin(origin, req);
  const isAllowed = Boolean(allowedByAllowlist || allowedBySameOrigin);
  
  // Debug Log for CORS troubleshooting
  if (origin) {
    logger.debug({ event: "cors_check", origin, allowed: isAllowed });
  }

  if (origin && !isAllowed) {
    logger.warn({ event: "cors_blocked", origin, allowlist: effectiveAllowlist });
    if (req.method === "OPTIONS") {
      return res.sendStatus(403);
    }
    return res.status(403).json({ message: "Origin not allowed" });
  }
  if (origin && isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
};
