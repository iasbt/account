
import crypto from "node:crypto";
import pool from "../db.js";
import { config } from "../config/index.js";
import { signToken, generateSupabaseToken } from "../utils/token.js";
import { parseAllowlist, isHostAllowed } from "../utils/helpers.js";

export const issueSsoToken = async (req, res) => {
  const target = String(req.query.target || "");
  if (!target) {
    return res.status(400).json({ message: "目标地址不能为空" });
  }
  const authUser = req.user; // Assuming requireAuth middleware adds user
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
  // 这是 V2.0 架构，支持多应用、多密钥、多 Token 格式
  let matchedApp = null;
  try {
    const origin = url.origin; // e.g. https://gallery.iasbt.com
    
    // 查询 allowed_origins 包含 origin 或 target 的应用
    // 注意：allowed_origins 是 TEXT[] 数组，且应用必须处于激活状态
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
    // Continue to legacy check if DB fails? Or fail? 
    // Usually safe to continue to legacy if DB fails, or just fail.
    // Let's log and proceed to legacy check.
  }
  
  // 2. 兼容旧的 Allowlist 模式 (Legacy Mode)
  // 如果注册表没匹配到，但 Allowlist 里有，则走默认逻辑
  // 这保证了向后兼容，防止直接切断未迁移的旧服务（虽然目前可能没有）
  const legacyAllowlist = parseAllowlist(config.ssoRedirectAllowlist);
  const isLegacyAllowed = isHostAllowed(url.hostname, legacyAllowlist);

  if (!matchedApp && !isLegacyAllowed) {
    return res.status(403).json({ message: "目标域名不允许 (Unknown Application)" });
  }

  // 3. 决定 Token 生成策略
  let accessToken;
  let refreshToken;
  
  // DB use snake_case, JS uses camelCase usually, but here we access raw rows
  const secret = matchedApp ? matchedApp.secret : config.ssoSecret;
  const tokenType = matchedApp ? matchedApp.token_type : 'supabase'; // 默认走 Supabase 格式兼容旧逻辑
  const appId = matchedApp ? matchedApp.app_id : 'legacy';

  try {
    if (tokenType === 'supabase') {
      // 生成 Supabase 兼容的 Token
      accessToken = generateSupabaseToken(authUser, secret);
      // Supabase Refresh Token
      refreshToken = signToken({ sub: authUser.id, type: 'refresh' }, 7 * 24 * 3600, secret);
    } else if (tokenType === 'standard') {
      // 生成标准 JWT (适用于 Toolbox, LifeOS 等不使用 Supabase 的应用)
      accessToken = signToken({
        sub: String(authUser.id),
        name: authUser.username,
        email: authUser.email,
        isAdmin: authUser.isAdmin,
        aud: appId,
        iss: 'account.iasbt.com'
      }, 3600, secret);
      // 简单 Refresh Token
      refreshToken = signToken({ sub: authUser.id, type: 'refresh' }, 7 * 24 * 3600, secret);
    } else {
      return res.status(500).json({ message: "不支持的 Token 类型: " + tokenType });
    }
  } catch (err) {
    console.error("Token generation failed:", err);
    return res.status(500).json({ message: "Token 生成失败" });
  }

  if (!accessToken) {
    return res.status(500).json({ message: "SSO Token 生成失败 (Internal Error)" });
  }
  
  // 4. 构建返回 URL
  // 使用 Hash Fragment 传递 Token (Supabase 客户端标准)
  // 格式: #access_token=...&refresh_token=...&expires_in=3600&token_type=bearer
  const fragment = new URLSearchParams();
  fragment.set("access_token", accessToken);
  fragment.set("refresh_token", refreshToken);
  fragment.set("expires_in", "3600");
  fragment.set("token_type", "bearer");
  fragment.set("type", "recovery"); // 或者是 magiclink? recovery 通常会让 supabase 直接 setSession

  // 将 Hash 追加到目标 URL
  // 注意：如果目标 URL 已有 Hash，这可能会覆盖，但通常 callback URL 不带 Hash
  url.hash = fragment.toString();

  return res.json({ url: url.toString() });
};
