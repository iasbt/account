
import pool from "../db.js";
import bcryptjs from "bcryptjs";
import { generateToken } from "../utils/token.js";
import { sendEmail } from "../utils/email.js";
import { getVerificationCodeTemplate } from "../utils/emailTemplates.js";
import { setVerificationCode, getVerificationCode, deleteVerificationCode } from "../utils/verificationStore.js";
import { checkLockout, recordFailedAttempt, resetAttempts } from "../utils/accountLock.js";
import { randomUUID, randomInt } from "crypto";

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
    const token = generateToken(user);

    await deleteVerificationCode(email);

    return { user, token };
  },

  async login({ account, password, skipLockout = false }) {
    // 1. Check Lockout
    if (!skipLockout) {
      const lockout = await checkLockout(account);
      if (lockout.locked) {
        throw new Error(`账号已被锁定，请在 ${Math.ceil(lockout.remaining / 60)} 分钟后重试`);
      }
    }

    const result = await pool.query(
      "SELECT * FROM public.users WHERE email = $1 OR name = $1",
      [account]
    );

    if (result.rowCount === 0) {
      if (!skipLockout) await recordFailedAttempt(account);
      throw new Error("账号或密码错误");
    }

    const user = result.rows[0];
    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      if (!skipLockout) await recordFailedAttempt(account);
      throw new Error("账号或密码错误");
    }

    // Login Success - Reset Attempts
    await resetAttempts(account);

    const token = generateToken(user);
    
    // Return safe user object
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin
    };

    return { user: safeUser, token };
  },

  async adminLogin({ account, password }) {
    // 1. Check Lockout
    const lockout = await checkLockout(account);
    if (lockout.locked) {
      throw new Error(`账号已被锁定，请在 ${Math.ceil(lockout.remaining / 60)} 分钟后重试`);
    }

    const result = await pool.query(
      "SELECT * FROM public.users WHERE email = $1 OR name = $1",
      [account]
    );

    if (result.rowCount === 0) {
      await recordFailedAttempt(account);
      throw new Error("账号或密码错误");
    }

    const user = result.rows[0];
    if (!user.is_admin) {
      // Don't record attempt for non-admin user trying to access admin? 
      // Actually, this is a failed admin login. We should probably record it.
      await recordFailedAttempt(account);
      throw new Error("无权访问");
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      await recordFailedAttempt(account);
      throw new Error("账号或密码错误");
    }

    // Login Success - Reset Attempts
    await resetAttempts(account);

    const token = generateToken(user);
    
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: true
    };

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
