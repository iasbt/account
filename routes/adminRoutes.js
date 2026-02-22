/**
 * @module AdminRoutes
 * @description 管理员门户操作路由
 * @basepath /api/admin
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/roleCheck.js";
import { getAllUsers } from "../controllers/adminController.js";
import { adminLogin } from "../controllers/authController.js";

const router = Router();

router.post("/auth/login", adminLogin);

// --- 中间件堆栈 ---
// 1. 验证 Token (认证)
// 2. 验证角色 (授权)
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @route GET /api/admin/users
 * @description 获取所有用户列表
 * @access Admin (管理员)
 */
router.get("/users", getAllUsers);

export default router;
