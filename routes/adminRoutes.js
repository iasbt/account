/**
 * @module AdminRoutes
 * @description 管理员门户操作路由
 * @basepath /admin
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/roleCheck.js";
import { getAllUsers, deleteUser, updateUser, resetUserPassword, getSystemStatus, sendTestEmail } from "../controllers/adminController.js";
import { getTemplates, updateTemplate } from "../controllers/emailTemplateController.js";
import { adminLogin } from "../controllers/authController.js";

const router = Router();

router.post("/auth/login", adminLogin);

// --- 中间件堆栈 ---
// 1. 验证 Token (认证)
// 2. 验证角色 (授权)
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @route GET /admin/system/status
 * @description 获取系统状态
 * @access Admin
 */
router.get("/system/status", getSystemStatus);

/**
 * @route POST /admin/email/test
 * @description 发送测试邮件
 * @access Admin
 */
router.post("/email/test", sendTestEmail);

/**
 * @route GET /admin/email/templates
 * @description 获取邮件模板
 * @access Admin
 */
router.get("/email/templates", getTemplates);

/**
 * @route PUT /admin/email/templates/:type
 * @description 更新邮件模板
 * @access Admin
 */
router.put("/email/templates/:type", updateTemplate);

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

/**
 * @route POST /admin/users/:id/reset-password
 * @description 重置用户密码 (发送邮件)
 * @access Admin (管理员)
 */
router.post("/users/:id/reset-password", resetUserPassword);

export default router;
