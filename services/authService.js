
import pool from "../config/db.js";
import bcryptjs from "bcryptjs";
import { issueAccessToken } from "./oidcProvider.js";
import { sendEmail } from "../utils/email.js";
import { getVerificationCodeTemplate } from "../utils/emailTemplates.js";
import { setVerificationCode, getVerificationCode, deleteVerificationCode } from "../utils/verificationStore.js";
import { checkLockout, recordFailedAttempt, resetAttempts } from "../utils/accountLock.js";
import { randomUUID, randomInt } from "crypto";

const findUserByAccount = async (account) => {
  let userResult = null;
  try {
    userResult = await pool.query(
      "SELECT * FROM public.users WHERE email = $1 OR name = $1",
      [account]
    );
  } catch (_error) {
    userResult = null;
  }
  if (userResult?.rowCount > 0) {
    return { user: userResult.rows[0], source: "users" };
  }
  let legacyResult = null;
  try {
    legacyResult = await pool.query(
      "SELECT * FROM public.legacy_users WHERE email = $1 OR username = $1",
      [account]
    );
  } catch (_error) {
    legacyResult = null;
  }
  if (legacyResult?.rowCount > 0) {
    return { user: legacyResult.rows[0], source: "legacy" };
  }
  return { user: null, source: null };
};

const normalizeLegacyUser = (legacyUser) => ({
  id: legacyUser.id,
  name: legacyUser.username,
  email: legacyUser.email,
  is_admin: legacyUser.is_admin || false,
  password: legacyUser.password_hash
});

const upsertLegacyUserToUsers = async (legacyUser) => {
  await pool.query(
    `INSERT INTO public.users (id, name, email, password, is_admin, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (email) DO UPDATE
     SET name = EXCLUDED.name,
         password = EXCLUDED.password,
         is_admin = EXCLUDED.is_admin,
         updated_at = NOW()`,
    [
      legacyUser.id,
      legacyUser.username,
      legacyUser.email,
      legacyUser.password_hash,
      legacyUser.is_admin || false
    ]
  );
};

const buildSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  isAdmin: user.is_admin || false
});

const verifyCredentials = async ({ account, password, skipLockout = false, requireAdmin = false }) => {
  const strictAdminAccount = "admin";

  if (requireAdmin && account !== strictAdminAccount) {
    if (!skipLockout) await recordFailedAttempt(account);
    throw new Error("无权访问");
  }

  if (!skipLockout) {
    const lockout = await checkLockout(account);
    if (lockout.locked) {
      throw new Error(`账号已被锁定，请在 ${Math.ceil(lockout.remaining / 60)} 分钟后重试`);
    }
  }

  const { user: foundUser, source } = await findUserByAccount(account);
  if (!foundUser) {
    if (!skipLockout) await recordFailedAttempt(account);
    throw new Error("账号或密码错误");
  }

  const user = source === "legacy" ? normalizeLegacyUser(foundUser) : foundUser;
  if (requireAdmin && !user.is_admin) {
    if (!skipLockout) await recordFailedAttempt(account);
    throw new Error("无权访问");
  }

  const isAdmin = account === strictAdminAccount && Boolean(user.is_admin);
  const resolvedUser = {
    ...user,
    is_admin: isAdmin
  };

  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    if (!skipLockout) await recordFailedAttempt(account);
    throw new Error("账号或密码错误");
  }

  if (source === "legacy") {
    await upsertLegacyUserToUsers(foundUser);
  }

  await resetAttempts(account);

  return { user: resolvedUser };
};

export const authService = {
  async sendVerificationCode(email, type = 'general') {
    const code = randomInt(100000, 1000000).toString();
    await setVerificationCode(email, code);

    const html = getVerificationCodeTemplate(code, type);
    let subject = "IASBT 账号验证码";
    if (type === 'register') subject = "欢迎注册 IASBT Account - 验证码";
    if (type === 'reset_password') subject = "重置密码验证 - IASBT Account";

    return await sendEmail(email, subject, html);
  },

  async verifyCode(email, code) {
    const storedCode = await getVerificationCode(email);
    if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expires) {
      return false;
    }
    return true;
  },

  async register({ name, email, password }) {
    // Check duplicates
    const existingUser = await pool.query(
      "SELECT id FROM public.users WHERE email = $1 OR name = $2",
      [email, name]
    );

    if (existingUser.rowCount > 0) {
      throw new Error("邮箱或用户名已被注册");
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);
    const userId = randomUUID();

    const result = await pool.query(
      "INSERT INTO public.users (id, name, email, password, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, email, is_admin",
      [userId, name, email, hash]
    );

    const user = result.rows[0];
    const token = await issueAccessToken(user.id);

    await deleteVerificationCode(email);

    return { user: buildSafeUser(user), token };
  },

  async login({ account, password, skipLockout = false }) {
    const { user } = await verifyCredentials({ account, password, skipLockout });
    const token = await issueAccessToken(user.id);
    return { user: buildSafeUser(user), token };
  },

  async verifyCredentials({ account, password, skipLockout = false, requireAdmin = false }) {
    return await verifyCredentials({ account, password, skipLockout, requireAdmin });
  },

  async adminLogin({ account, password, skipLockout = false }) {
    const { user } = await verifyCredentials({ account, password, skipLockout, requireAdmin: true });
    const token = await issueAccessToken(user.id);
    const safeUser = buildSafeUser(user);
    safeUser.isAdmin = true;
    return { user: safeUser, token };
  },

  async resetPassword({ email, password, code }) {
    const isValid = await this.verifyCode(email, code);
    if (!isValid) {
      throw new Error("验证码无效或已过期");
    }

    const userResult = await pool.query("SELECT id FROM public.users WHERE email = $1", [email]);
    if (userResult.rowCount === 0) {
      throw new Error("用户不存在");
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);

    await pool.query("UPDATE public.users SET password = $1, updated_at = NOW() WHERE email = $2", [hash, email]);
    await deleteVerificationCode(email);
    
    return true;
  },

  async changePassword(userId, { oldPassword, newPassword }) {
    const result = await pool.query("SELECT password FROM public.users WHERE id = $1", [userId]);
    if (result.rowCount === 0) throw new Error("用户不存在");

    const user = result.rows[0];
    const isMatch = await bcryptjs.compare(oldPassword, user.password);
    if (!isMatch) throw new Error("旧密码错误");

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(newPassword, salt);

    await pool.query("UPDATE public.users SET password = $1, updated_at = NOW() WHERE id = $2", [hash, userId]);
    return true;
  }
,

  async updateProfile(userId, { name, avatar }) {
    const updates = [];
    const values = [];
    let idx = 1;

    if (name) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (avatar) {
      updates.push(`avatar = $${idx++}`);
      values.push(avatar);
    }

    if (updates.length === 0) return null;

    values.push(userId);
    const query = `UPDATE public.users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, name, email, is_admin`;
    
    const result = await pool.query(query, values);
    if (result.rowCount === 0) throw new Error("用户不存在");
    
    return result.rows[0];
  }
};
