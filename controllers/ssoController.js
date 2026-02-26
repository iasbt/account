
import pool from "../db.js";
import { config } from "../config/index.js";
import { signToken } from "../utils/token.js";

export const issueSsoToken = async (req, res) => {
  const target = String(req.query.target || "");
  if (!target) {
    return res.status(400).json({ message: "目标地址不能为空" });
  }
  const authUser = req.user;
  if (!authUser) {
    return res.status(401).json({ message: "未登录" });
  }
  let url;
  try {
    url = new URL(target);
  } catch {
    return res.status(400).json({ message: "目标地址不合法" });
  }
  
  // 1. 尝试从应用数据库中匹配目标应用 (Application Registry V2.0)
  let matchedApp = null;
  try {
    const origin = url.origin;
    
    const result = await pool.query(
      `SELECT * FROM public.applications 
       WHERE ($1 = ANY(allowed_origins) OR $2 = ANY(allowed_origins))
       AND is_active = true
       LIMIT 1`,
      [origin, target]
    );
    
    if (result.rowCount > 0) {
      matchedApp = result.rows[0];
    }
  } catch (dbErr) {
    console.error("SSO App Lookup Failed:", dbErr);
    return res.status(500).json({ message: "应用查找失败" });
  }
  
  if (!matchedApp) {
    return res.status(403).json({ message: "目标域名未注册或不允许 (Unknown Application)" });
  }

  // 2. 生成 Token
  let accessToken;
  let refreshToken;
  const secret = matchedApp.secret || config.ssoSecret;
  const appId = matchedApp.app_id;

  try {
    accessToken = signToken({
      sub: String(authUser.id),
      name: authUser.username,
      email: authUser.email,
      isAdmin: authUser.isAdmin,
      aud: appId,
      iss: 'account.iasbt.com'
    }, 3600, secret);
    
    // Refresh Token 保持较长有效期
    refreshToken = signToken({ 
      sub: authUser.id, 
      type: 'refresh',
      aud: appId
    }, 7 * 24 * 3600, secret);
  } catch (err) {
    console.error("Token generation failed:", err);
    return res.status(500).json({ message: "Token 生成失败" });
  }

  if (!accessToken) {
    return res.status(500).json({ message: "SSO Token 生成失败 (Internal Error)" });
  }
  
  // 3. 构建返回 URL
  const fragment = new URLSearchParams();
  fragment.set("access_token", accessToken);
  fragment.set("refresh_token", refreshToken);
  fragment.set("expires_in", "3600");
  fragment.set("token_type", "bearer");
  
  url.hash = fragment.toString();

  return res.json({ url: url.toString() });
};
