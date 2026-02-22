import { verifyToken } from "../utils/token.js";

export const getAuthUser = (req) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return verifyToken(token);
};

export const requireAuth = (req, res, next) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "未登录" });
  }
  req.user = user;
  next();
};
