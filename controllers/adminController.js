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
