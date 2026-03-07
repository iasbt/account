import { verifyAccessToken } from "../services/logtoAuth.js";
import { syncLogtoUser } from "../services/userService.js";
import { logger } from "../utils/logger.js";

// Legacy cookie check removed. We now strictly use Bearer Token from Logto SDK.

export const getAuthUser = async (/** @type {import("express").Request} */ req) => {
  const header = req.headers.authorization || "";
  const bearerToken = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  
  if (bearerToken) {
    const bearerUser = await verifyAccessToken(bearerToken);
    if (bearerUser) return bearerUser;
  }
  
  // No token or invalid token
  return null;
};

export const requireAuth = async (/** @type {any} */ req, /** @type {import("express").Response} */ res, /** @type {import("express").NextFunction} */ next) => {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "未登录或凭证已过期" });
  }
  
  // Normalize user ID from token subject
  if (user.sub && !user.id) user.id = user.sub;
  if (user.is_admin !== undefined && user.isAdmin === undefined) user.isAdmin = user.is_admin;
  
  // Sync Logto user to local DB (Just-in-Time Migration)
  // This ensures foreign key constraints are satisfied for subsequent operations.
  try {
    const syncedUser = await syncLogtoUser(user);
    if (syncedUser) {
      // Merge local DB data (like custom roles or preferences stored in user table) back to req.user if needed
      user.local_id = syncedUser.id;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.warn({ event: "user_sync_failed", error: errorMessage, userId: user.id });
    // We don't block the request, but subsequent DB writes might fail
  }

  req.user = user;
  next();
};
