import pool from "../db.js";

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, username, created_at, is_admin FROM public.legacy_users ORDER BY created_at DESC"
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
