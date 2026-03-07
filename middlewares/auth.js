import { verifyAccessToken } from "../services/logtoAuth.js";
import { syncLogtoUser } from "../services/userService.js";
import { logger } from "../utils/logger.js";

const getTokenFromCookie = (cookieHeader = "") => {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.trim().split("=");
    if (rawKey !== "account_token") continue;
    const value = rest.join("=");
    return value ? decodeURIComponent(value) : null;
  }
  return null;
};

export const getAuthUser = async (req) => {
  const header = req.headers.authorization || "";
  const bearerToken = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  if (bearerToken) {
    const bearerUser = await verifyAccessToken(bearerToken);
    if (bearerUser) return bearerUser;
  }
  const cookieToken = getTokenFromCookie(req.headers.cookie || "");
  if (!cookieToken) return null;
  return await verifyAccessToken(cookieToken);
};

export const requireAuth = async (req, res, next) => {
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
    logger.warn({ event: "user_sync_failed", error: err.message, userId: user.id });
    // We don't block the request, but subsequent DB writes might fail
  }

  req.user = user;
  next();
};
