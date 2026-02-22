/**
 * @module AdminController
 * @description 仅限管理员操作的控制器
 */

import pool from "../db.js";

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
