import pool from "../db.js";
import bcryptjs from "bcryptjs";
import { generateToken, generateSsoToken } from "../utils/token.js";
import { sendEmail } from "../utils/email.js";
import { setVerificationCode, getVerificationCode, deleteVerificationCode } from "../utils/verificationStore.js";

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "邮箱不能为空", success: false });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await setVerificationCode(email, code);

  const subject = "IASBT 账号验证码";
  const html = `<p>您的验证码是：<strong>${code}</strong></p><p>该验证码5分钟内有效。</p>`;
  
  const success = await sendEmail(email, subject, html);
  
  if (success) {
    res.json({ message: "验证码已发送", success: true });
  } else {
    res.status(500).json({ message: "邮件发送失败", success: false });
  }
};

export const register = async (req, res) => {
  const { name, email, password, code } = req.body;
  
  if (!name || !email || !password || !code) {
    return res.status(400).json({ message: "所有字段都是必填的", success: false });
  }

  const storedCode = getVerificationCode(email);
  if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expires) {
    return res.status(400).json({ message: "验证码无效或已过期", success: false });
  }

  try {
    const existingUser = await pool.query("SELECT id FROM public.legacy_users WHERE email = $1", [email]);
    if (existingUser.rowCount > 0) {
      return res.status(400).json({ message: "邮箱已被注册", success: false });
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);

    const result = await pool.query(
      "INSERT INTO public.legacy_users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
      [name, email, hash]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    
    deleteVerificationCode(email);

    res.status(201).json({
      message: "注册成功",
      success: true,
      token,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        isAdmin: false
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "注册失败", success: false });
  }
};

export const login = async (req, res) => {
  const { account, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM public.legacy_users WHERE email = $1 OR username = $1",
      [account]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "账号或密码错误", success: false });
    }

    const user = result.rows[0];
    const isValid = await bcryptjs.compare(password, user.password_hash || "");

    if (!isValid) {
      return res.status(401).json({ message: "账号或密码错误", success: false });
    }

    const token = generateToken(user);

    res.json({
      message: "登录成功",
      success: true,
      token,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        isAdmin: user.is_admin || false // 假设 DB 有 is_admin 字段，如果没有默认 false
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "登录失败", success: false });
  }
};

export const adminLogin = async (req, res) => {
  const { account, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM public.legacy_users WHERE email = $1 OR username = $1",
      [account]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "账号或密码错误", success: false });
    }

    const user = result.rows[0];
    
    // 检查管理员权限 (假设 is_admin 字段存在，或者硬编码某些账号)
    // 这里假设数据库有 is_admin 字段
    if (!user.is_admin) {
        return res.status(403).json({ message: "非管理员账号", success: false });
    }

    const isValid = await bcryptjs.compare(password, user.password_hash || "");

    if (!isValid) {
      return res.status(401).json({ message: "账号或密码错误", success: false });
    }

    const token = generateToken(user);

    res.json({
      message: "管理员登录成功",
      success: true,
      token,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "登录失败", success: false });
  }
};

export const getSsoToken = async (req, res) => {
  try {
    const user = req.user; // from requireAuth middleware
    // 生成一次性 Token
    const ssoToken = generateSsoToken(user);
    res.json({ token: ssoToken, email: user.email });
  } catch (error) {
    console.error("SSO Token error:", error);
    res.status(500).json({ message: "获取 SSO Token 失败" });
  }
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.sub; // assuming JWT payload has sub as user id

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
    console.error("Change password error", error);
    return res.status(500).json({ message: "修改密码失败", success: false });
  }
};

export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "参数不完整", success: false });
  }

  const storedCode = getVerificationCode(email);
  if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expires) {
    return res.status(400).json({ message: "验证码无效或已过期", success: false });
  }

  try {
    const userResult = await pool.query("SELECT id FROM public.legacy_users WHERE email = $1", [email]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "用户不存在", success: false });
    }
    const userId = userResult.rows[0].id;

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(newPassword, salt);

    await pool.query(
      "UPDATE public.legacy_users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hash, userId]
    );
    
    await deleteVerificationCode(email);

    res.json({ message: "密码重置成功", success: true });
  } catch (error) {
    console.error("Reset password error", error);
    res.status(500).json({ message: "重置密码失败", success: false });
  }
};
