
import pool from "../db.js";
import { authService } from "../services/authService.js";
import { verifyToken } from "../utils/token.js";

export const sendVerificationCode = async (req, res) => {
  try {
    const { email, type = 'general' } = req.body;
    const success = await authService.sendVerificationCode(email, type);
    
    if (success) {
      res.json({ message: "验证码已发送", success: true });
    } else {
      res.status(500).json({ message: "邮件发送失败", success: false });
    }
  } catch (error) {
    console.error("Send code error:", error);
    res.status(500).json({ message: error.message || "发送失败", success: false });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, code } = req.body;
    
    // Verify code first
    const isValid = await authService.verifyCode(email, code);
    if (!isValid) {
      return res.status(400).json({ message: "验证码无效或已过期", success: false });
    }

    const { user, token } = await authService.register({ name, email, password });

    res.status(201).json({
      message: "注册成功",
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(400).json({ message: error.message || "注册失败", success: false });
  }
};

export const login = async (req, res) => {
  try {
    const { account, password } = req.body;
    const { user, token } = await authService.login({ account, password });

    res.json({
      message: "登录成功",
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ message: error.message || "登录失败", success: false });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { account, password } = req.body;
    const { user, token } = await authService.adminLogin({ account, password });

    res.json({
      message: "管理员登录成功",
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(401).json({ message: error.message || "登录失败", success: false });
  }
};

export const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "未登录", success: false });
  }
  
  res.json({
    success: true,
    user: req.user
  });
};

export const getSsoToken = async (req, res) => {
  try {
    const token = authService.getSsoToken(req.user);
    res.json({ token, success: true });
  } catch (error) {
    console.error("SSO token error:", error);
    res.status(500).json({ message: "获取SSO Token失败", success: false });
  }
};

export const getSupabaseUser = async (req, res) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "未登录" });
  }

  let payload = verifyToken(token);
  if (!payload) {
    try {
      const result = await pool.query(
        "SELECT secret FROM public.applications WHERE token_type = 'supabase' AND secret IS NOT NULL"
      );
      for (const row of result.rows) {
        const candidate = verifyToken(token, row.secret);
        if (candidate) {
          payload = candidate;
          break;
        }
      }
    } catch (error) {
      console.error("Supabase token verification error:", error);
    }
  }

  if (!payload || !(payload.sub || payload.id)) {
    return res.status(401).json({ message: "未登录" });
  }

  const now = new Date().toISOString();
  const user = {
    id: String(payload.sub || payload.id),
    aud: payload.aud || "authenticated",
    role: payload.role || "authenticated",
    email: payload.email || null,
    phone: payload.phone || "",
    app_metadata: payload.app_metadata || {},
    user_metadata: payload.user_metadata || {},
    created_at: payload.created_at || now,
    updated_at: payload.updated_at || now
  };

  return res.json(user);
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password, code } = req.body;
    await authService.resetPassword({ email, password, code });
    res.json({ message: "密码重置成功", success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({ message: error.message || "重置失败", success: false });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(userId, { oldPassword, newPassword });
    res.json({ message: "密码修改成功", success: true });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(400).json({ message: error.message || "修改失败", success: false });
  }
};
