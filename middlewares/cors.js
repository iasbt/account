import { config } from "../config/index.js";
import { parseOrigins, isOriginAllowed, defaultAllowlist } from "../utils/helpers.js";

const originAllowlist = parseOrigins(config.corsAllowlist);
const effectiveAllowlist = originAllowlist.length > 0 ? originAllowlist : defaultAllowlist;

export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Debug Log for CORS troubleshooting
  if (origin) {
    console.log(`[CORS] Incoming Origin: ${origin}`);
    console.log(`[CORS] Effective Allowlist: ${JSON.stringify(effectiveAllowlist)}`);
  }

  if (origin && !isOriginAllowed(origin, effectiveAllowlist)) {
    console.warn(`[CORS] Blocked Origin: ${origin}. Allowed: ${effectiveAllowlist.join(", ")}`);
    if (req.method === "OPTIONS") {
      return res.sendStatus(403);
    }
    return res.status(403).json({ message: "Origin not allowed" });
  }
  if (origin && isOriginAllowed(origin, effectiveAllowlist)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey, x-client-info, x-supabase-api-version, prefer, range");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
};
