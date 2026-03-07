import { verifyAccessToken } from "../services/logtoAuth.js";

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
  
  req.user = user;
  next();
};
