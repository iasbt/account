/**
 * @module AdminController
 * @description 仅限管理员操作的控制器
 */

import pool from "../db.js";
import { sendEmail } from "../utils/email.js";
import { setVerificationCode } from "../utils/verificationStore.js";

/**
 * 从 legacy_users 表获取所有注册用户。
 * 仅限管理员访问。
 * 
 * @route GET /api/admin/users
 * @access Private/Admin (私有/管理员)
 * @param {import('express').Request} req - Express 请求对象
 * @param {import('express').Response} res - Express 响应对象
 */
export const getAllUsers = async (req, res) => {
  try {
    // 查询 legacy_users 表获取用户列表
    // 待办: 如果需要，在 Phase 4 迁移到标准的 'users' 表
    const result = await pool.query(
      "SELECT id, email, username, created_at FROM public.legacy_users ORDER BY created_at DESC"
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
    const result = await pool.query(
      "DELETE FROM public.legacy_users WHERE id = $1 RETURNING id",
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
  const { username, email } = req.body;

  try {
    const result = await pool.query(
      "UPDATE public.legacy_users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email",
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
    const userResult = await pool.query("SELECT email, username FROM public.legacy_users WHERE id = $1", [id]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }
    const user = userResult.rows[0];
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await setVerificationCode(user.email, code);
    
    // 前端页面地址，需确保路由存在
    // 假设 ResetPasswordPage 路由为 /reset-password
    const resetLink = `https://account.iasbt.com/reset-password?email=${encodeURIComponent(user.email)}&code=${code}`;
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>密码重置通知</h2>
        <p>亲爱的 ${user.username},</p>
        <p>管理员已为您发起了密码重置请求。</p>
        <p>请点击下方链接设置新密码：</p>
        <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0071e3; color: white; text-decoration: none; border-radius: 5px;">重置密码</a></p>
        <p>或复制以下链接到浏览器：</p>
        <p>${resetLink}</p>
        <p>该链接5分钟内有效。</p>
      </div>
    `;
    
    await sendEmail(user.email, "IASBT 账号密码重置", html);
    
    res.json({ success: true, message: "重置邮件已发送" });
  } catch (error) {
    console.error("Reset password error", error);
    res.status(500).json({ success: false, message: "重置操作失败" });
  }
};
