import bcryptjs from "bcryptjs";
import crypto from "node:crypto";
import pool from "../db.js";
import { sendCode } from "../emailService.js";
import { signToken } from "../utils/token.js";
import { cleanupSsoTokens, ssoTokenStore } from "../utils/ssoStore.js";
import { config } from "../config/index.js";
import { logAudit } from "../middlewares/logger.js";

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "邮箱不能为空", success: false });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    await pool.query(
      "INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)",
      [email, code, expiresAt]
    );

    await sendCode(email, code);

    return res.json({ message: "验证码发送成功", success: true });
  } catch (error) {
    console.error("Send code error", { requestId: req.requestId, error });
    return res.status(500).json({ message: "验证码发送失败", success: false });
  }
};

export const register = async (req, res) => {
  const { email, code, password, name } = req.body;

  if (!email || !code || !password || !name) {
    return res.status(400).json({ message: "参数不完整", success: false });
  }

  try {
    const codeResult = await pool.query(
      "SELECT id FROM verification_codes WHERE email = $1 AND code = $2 AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [email, code]
    );

    if (codeResult.rowCount === 0) {
      return res.status(400).json({ message: "验证码无效或已过期", success: false });
    }

    const userResult = await pool.query(
      "SELECT id FROM public.legacy_users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (userResult.rowCount > 0) {
      return res.status(400).json({ message: "邮箱已注册", success: false });
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);
    const userId = crypto.randomUUID();

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO public.legacy_users
          (id, email, password_hash, username, created_at, updated_at, has_accepted_upload_terms, has_seen_onboarding)
         VALUES ($1, $2, $3, $4, NOW(), NOW(), FALSE, FALSE)`,
        [userId, email, passwordHash, name]
      );
      await client.query(
        "UPDATE verification_codes SET is_used = TRUE WHERE id = $1",
        [codeResult.rows[0].id]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Register transaction error", { requestId: req.requestId, error });
      return res.status(500).json({ message: "注册失败", success: false });
    } finally {
      client.release();
    }

    const token = signToken(
      { sub: userId, email, name, displayName: name, avatar: "", isAdmin: false, tokenType: "user" },
      60 * 60 * 12
    );
    return res.json({
      message: "注册成功！",
      success: true,
      token,
      user: { id: userId, email, name, displayName: name, avatar: "", isAdmin: false },
    });
  } catch (error) {
    console.error("Register error", { requestId: req.requestId, error });
    return res.status(500).json({ message: "注册失败", success: false });
  }
};

export const login = async (req, res) => {
  const { account, password } = req.body;

  if (!account || !password) {
    return res.status(400).json({ message: "参数不完整", success: false });
  }

  try {
    const userResult = await pool.query(
      "SELECT id, email, username, password_hash FROM public.legacy_users WHERE email = $1 OR username = $1 LIMIT 1",
      [account]
    );

    if (userResult.rowCount === 0) {
      return res.status(400).json({ message: "用户不存在", success: false });
    }

    const user = userResult.rows[0];
    const hash = user.password_hash || "";
    if (!hash.startsWith("$2")) {
      return res.status(400).json({ message: "密码格式异常", success: false });
    }
    const isValid = await bcryptjs.compare(password, hash);

    if (!isValid) {
      return res.status(400).json({ message: "账号或密码错误", success: false });
    }

    const token = signToken(
      {
        sub: user.id,
        email: user.email,
        name: user.username,
        displayName: user.username,
        avatar: "",
        isAdmin: false,
        tokenType: "user",
      },
      60 * 60 * 12
    );
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.username,
        displayName: user.username,
        avatar: "",
        isAdmin: false,
      },
    });
  } catch (error) {
    console.error("Login error", { requestId: req.requestId, error });
    return res.status(500).json({ message: "登录失败", success: false });
  }
};

export const adminLogin = async (req, res) => {
  const { account, password } = req.body;
  const auditBase = {
    requestId: req.requestId,
    account: account || "",
    ip: req.ip,
  };

  if (!account || !password) {
    logAudit({ ...auditBase, success: false, reason: "missing_params" });
    return res.status(400).json({ message: "参数不完整", success: false });
  }

  try {
    const adminResult = await pool.query(
      "SELECT id, email, password_hash, security_level FROM public.admin_accounts WHERE email = $1 LIMIT 1",
      [account]
    );

    if (adminResult.rowCount === 0) {
      logAudit({ ...auditBase, success: false, reason: "not_found" });
      return res.status(400).json({ message: "用户不存在", success: false });
    }

    const admin = adminResult.rows[0];
    const hash = admin.password_hash || "";
    if (!hash.startsWith("$2")) {
      logAudit({ ...auditBase, success: false, reason: "invalid_hash", adminId: admin.id });
      return res.status(400).json({ message: "密码格式异常", success: false });
    }
    const isValid = await bcryptjs.compare(password, hash);

    if (!isValid) {
      logAudit({ ...auditBase, success: false, reason: "invalid_password", adminId: admin.id });
      return res.status(400).json({ message: "账号或密码错误", success: false });
    }

    const token = signToken(
      {
        sub: admin.id,
        email: admin.email,
        name: admin.email,
        displayName: admin.email,
        avatar: "",
        isAdmin: true,
        tokenType: "admin",
        securityLevel: admin.security_level || 1,
      },
      60 * 60 * 12
    );

    logAudit({
      ...auditBase,
      success: true,
      adminId: admin.id,
      securityLevel: admin.security_level || 1,
    });
    return res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.email,
        displayName: admin.email,
        avatar: "",
        isAdmin: true,
      },
    });
  } catch (error) {
    logAudit({ ...auditBase, success: false, reason: "server_error" });
    console.error("Admin login error", { requestId: req.requestId, error });
    return res.status(500).json({ message: "登录失败", success: false });
  }
};

export const getSsoToken = async (req, res) => {
  const authUser = req.user; // Assuming requireAuth middleware adds user
  if (!authUser) {
    return res.status(401).json({ message: "未登录" });
  }
  cleanupSsoTokens();
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + config.ssoTokenTtl * 1000;
  ssoTokenStore.set(token, {
    userId: authUser.sub,
    email: authUser.email,
    name: authUser.name,
    displayName: authUser.displayName,
    avatar: authUser.avatar,
    isAdmin: authUser.isAdmin,
    expiresAt,
  });
  res.cookie("sso_token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: config.ssoTokenTtl * 1000,
  });
  return res.json({ token, email: authUser.email, expiresAt });
};
