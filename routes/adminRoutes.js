/**
 * @module AdminRoutes
 * @description 管理员门户操作路由
 * @basepath /admin
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/roleCheck.js";
import { getAllUsers, deleteUser, updateUser } from "../controllers/adminController.js";
import { adminLogin } from "../controllers/authController.js";

const router = Router();

router.post("/auth/login", adminLogin);

// --- 中间件堆栈 ---
// 1. 验证 Token (认证)
// 2. 验证角色 (授权)
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @route GET /admin/users
 * @description 获取所有用户列表
 * @access Admin (管理员)
 */
router.get("/users", getAllUsers);

/**
 * @route DELETE /admin/users/:id
 * @description 删除用户
 * @access Admin (管理员)
 */
router.delete("/users/:id", deleteUser);

/**
 * @route PUT /admin/users/:id
 * @description 更新用户信息
 * @access Admin (管理员)
 */
router.put("/users/:id", updateUser);

export default router;
