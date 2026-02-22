export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.sub;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "参数不完整", success: false });
  }

  try {
    const userResult = await pool.query(
      "SELECT password_hash FROM public.legacy_users WHERE id = $1 LIMIT 1",
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "用户不存在", success: false });
    }

    const user = userResult.rows[0];
    const hash = user.password_hash || "";
    
    const isValid = await bcryptjs.compare(oldPassword, hash);
    if (!isValid) {
      return res.status(400).json({ message: "旧密码错误", success: false });
    }

    const salt = await bcryptjs.genSalt(10);
    const newHash = await bcryptjs.hash(newPassword, salt);

    await pool.query(
      "UPDATE public.legacy_users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newHash, userId]
    );

    return res.json({ message: "密码修改成功", success: true });
  } catch (error) {
    console.error("Change password error", { requestId: req.requestId, error });
    return res.status(500).json({ message: "修改密码失败", success: false });
  }
};
