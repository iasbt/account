/**
 * @module AdminController
 * @description 仅限管理员操作的控制器
 */

import pool from "../config/db.js";
import { sendEmail } from "../utils/email.js";
import { getPasswordResetLinkTemplate, getVerificationCodeTemplate, getNotificationTemplate } from "../utils/emailTemplates.js";
import { setVerificationCode } from "../utils/verificationStore.js";
import { config } from "../config/index.js";
import { randomInt } from "crypto";

const accountPublicUrl = (process.env.ACCOUNT_PUBLIC_URL || process.env.BASE_URL || "https://iasbt.cloud").replace(/\/+$/, "");

/**
 * @route GET /api/admin/system/status
 * @description 获取系统状态信息
 * @access Private/Admin
 */
export const getSystemStatus = async (req, res) => {
  try {
    const dbStatus = await pool.query("SELECT 1");
    
    res.json({
      success: true,
      status: {
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        dbConnection: dbStatus.rowCount === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        smtp: {
          host: config.smtp.host,
          port: config.smtp.port,
          user: config.smtp.user ? 'configured' : 'missing',
        }
      }
    });
  } catch (error) {
    console.error("System status error", error);
    res.status(500).json({ success: false, message: "获取系统状态失败" });
  }
};

/**
 * @route POST /api/admin/email/test
 * @description 发送测试邮件
 * @access Private/Admin
 */
export const sendTestEmail = async (req, res) => {
  const { email, type = 'general' } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: "目标邮箱不能为空" });
  }

  try {
    let html;
    let subject;
    const testCode = "123456";

    switch (type) {
      case 'register':
        html = getVerificationCodeTemplate(testCode, 'register');
        subject = "测试: 欢迎注册 IASBT Account";
        break;
      case 'reset_password':
        html = getVerificationCodeTemplate(testCode, 'reset_password');
        subject = "测试: 重置密码验证";
        break;
      case 'reset_link':
        html = getPasswordResetLinkTemplate(`${accountPublicUrl}/reset-password?token=test`);
        subject = "测试: 密码重置链接";
        break;
      default:
        html = getNotificationTemplate("系统测试邮件", "这是一封来自管理后台的测试邮件，用于验证邮件服务配置是否正常。");
        subject = "测试: 系统通知";
    }

    const success = await sendEmail(email, subject, html);

    if (success) {
      res.json({ success: true, message: `测试邮件 (${type}) 已发送至 ${email}` });
    } else {
      res.status(500).json({ success: false, message: "邮件发送失败，请检查服务器日志" });
    }
  } catch (error) {
    console.error("Test email error", error);
    res.status(500).json({ success: false, message: "发送测试邮件时发生错误" });
  }
};


/**
 * 从 users 表获取所有注册用户。
 * 仅限管理员访问。
 * 
 * @route GET /api/admin/users
 * @access Private/Admin (私有/管理员)
 */
export const getAllUsers = async (req, res) => {
  try {
    // 查询 public.users 表 (V2 Standard)
    // Alias name -> username specifically for frontend compatibility
    const result = await pool.query(
      "SELECT id, email, name as username, created_at, is_admin FROM public.users ORDER BY created_at DESC"
    );
    
    res.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error("Get all users error", error);
    res.status(500).json({ success: false, message: "获取用户列表失败" });
  }
};

/**
 * 删除用户。
 * 仅限管理员访问。
 * 
 * @route DELETE /api/admin/users/:id
 * @access Private/Admin (私有/管理员)
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if user is admin
    const userCheck = await pool.query("SELECT is_admin FROM public.users WHERE id = $1", [id]);
    if (userCheck.rowCount > 0 && userCheck.rows[0].is_admin) {
      return res.status(403).json({ success: false, message: "无法通过Web接口删除管理员账号" });
    }

    const result = await pool.query(
      "DELETE FROM public.users WHERE id = $1 RETURNING id",
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    res.json({
      success: true,
      message: "用户删除成功",
      id: result.rows[0].id
    });
  } catch (error) {
    console.error("Delete user error", error);
    res.status(500).json({ success: false, message: "删除用户失败" });
  }
};

/**
 * 更新用户信息。
 * 仅限管理员访问。
 * 
 * @route PUT /api/admin/users/:id
 * @access Private/Admin (私有/管理员)
 */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body; // Removed is_admin from destructuring

  try {
    // Map username -> name
    // Removed is_admin from UPDATE query
    const result = await pool.query(
      "UPDATE public.users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name as username, email, is_admin",
      [username, email, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }

    res.json({
      success: true,
      message: "用户更新成功",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Update user error", error);
    res.status(500).json({ success: false, message: "更新用户失败" });
  }
};

/**
 * 管理员重置用户密码。
 * 发送包含验证码的链接到用户邮箱。
 * 
 * @route POST /api/admin/users/:id/reset-password
 * @access Private/Admin
 */
export const resetUserPassword = async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query("SELECT email, name as username FROM public.users WHERE id = $1", [id]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }
    const user = userResult.rows[0];
    
    const code = randomInt(100000, 1000000).toString();
    await setVerificationCode(user.email, code);
    
    // 前端页面地址，需确保路由存在
    // 假设 ResetPasswordPage 路由为 /reset-password
    const resetLink = `${accountPublicUrl}/reset-password?email=${encodeURIComponent(user.email)}&code=${code}`;
    
    const html = getPasswordResetLinkTemplate(resetLink);
    
    await sendEmail(user.email, "IASBT 账号密码重置", html);
    
    res.json({ success: true, message: "重置邮件已发送" });
  } catch (error) {
    console.error("Reset password error", error);
    res.status(500).json({ success: false, message: "重置操作失败" });
  }
};
