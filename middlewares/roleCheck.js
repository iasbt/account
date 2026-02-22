/**
 * @module RoleMiddleware
 * @description 基于角色的访问控制 (RBAC) 中间件
 */

/**
 * 验证已认证用户是否拥有管理员权限的中间件。
 * 必须放置在认证中间件（填充 req.user）之后。
 * 
 * @param {import('express').Request} req - Express 请求对象 (必须包含 req.user)
 * @param {import('express').Response} res - Express 响应对象
 * @param {import('express').NextFunction} next - Express next 函数
 * @returns {void}
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.tokenType !== "admin") {
    return res.status(403).json({ message: "权限不足：需要管理员权限" });
  }
  next();
};
