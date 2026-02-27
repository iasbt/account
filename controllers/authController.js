
import { authService } from "../services/authService.js";
import { isValidRedirectTarget } from "../utils/redirectValidator.js";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { auditLogger, AuditEvent } from "../services/auditLogger.js";

const isWhitelisted = (req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  return config.debugAllowlist.some(allowed => ip.includes(allowed));
};

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
    const skipLockout = isWhitelisted(req);
    const { user, token } = await authService.login({ account, password, skipLockout });

    // Audit Log
    auditLogger.log(AuditEvent.LOGIN_SUCCESS, req, { account }, user.id);

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
    const skipLockout = isWhitelisted(req);
    const { user, token } = await authService.adminLogin({ account, password, skipLockout });

    res.json({
      message: "管理员登录成功",
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error("Admin login error:", error);
    // Audit Log (Fail)
    auditLogger.log(AuditEvent.LOGIN_FAIL, req, { account: req.body.account, isAdmin: true, error: error.message });
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


export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.user.id;
    
    const user = await authService.updateProfile(userId, { name, avatar });
    
    if (!user) {
        return res.json({ success: true, message: "无变更" });
    }

    res.json({
      success: true,
      message: "更新成功",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(400).json({ message: error.message || "更新失败", success: false });
  }
};

export const logout = async (req, res) => {
  try {
    // 1. 获取 Token 并加入黑名单
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, config.ssoSecret);
        if (decoded && decoded.exp) {
          const now = Math.floor(Date.now() / 1000);
          const ttl = decoded.exp - now;
          if (ttl > 0) {
            await addToBlacklist(token, ttl);
            console.log(`Token blacklisted for user ${decoded.id}, TTL: ${ttl}s`);
          }
        }
      } catch (e) {
        // Token 可能已经过期或无效，忽略错误
        console.warn("Logout: Token validation failed (already expired?)", e.message);
      }
    }

    // 2. 如果使用了 Cookie，清除它 (预留)
    // res.clearCookie('token');

    // 3. 处理 SSO 重定向
    const { target } = req.query;
    
    if (target) {
      // 验证 target 是否合法，防止 Open Redirect
      if (isValidRedirectTarget(target)) {
        // [Critical Fix] 
        // 为了防止 SSO 循环登录 (Loop)，我们必须重定向到前端的 /logout 页面以清除前端状态 (LocalStorage)
        // 假设前端与后端同域，或前端位于根路径
        return res.redirect(`/logout?target=${encodeURIComponent(target)}`);
      } else {
        console.warn(`Blocked invalid redirect attempt to: ${target}`);
        // 如果 target 不合法，不重定向，而是返回 JSON 提示
      }
    }

    // 4. 默认返回 JSON
    // Audit Log
    auditLogger.log(AuditEvent.LOGOUT, req, { message: "Success" });
    
    res.json({
      success: true,
      message: "已安全退出"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "退出失败", success: false });
  }
};
