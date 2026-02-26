import { verifyAppToken } from "../utils/token.js";

export const getAuthUser = async (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.split(" ")[1];
  if (!token) return null;
  return await verifyAppToken(token);
};

export const requireAuth = async (req, res, next) => {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "未登录或凭证已过期" });
  }
  
  // Normalize user ID from token subject
  if (user.sub && !user.id) {
    user.id = user.sub;
  }
  
  req.user = user;
  next();
};
