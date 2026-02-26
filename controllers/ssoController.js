
import pool from "../db.js";
import { config } from "../config/index.js";
import { signToken } from "../utils/token.js";
import { generateAuthCode, storeAuthCode, getAuthCode, invalidateAuthCode } from "../utils/oauth.js";

/**
 * @deprecated Legacy Implicit Flow (Use /oauth/authorize instead)
 */
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

/**
 * OAuth 2.0 Authorization Endpoint (Protected by requireAuth)
 * Generates an Authorization Code for the client.
 */
export const authorize = async (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.body;
  
  if (!client_id || !redirect_uri) {
    return res.status(400).json({ error: "invalid_request", message: "Missing client_id or redirect_uri" });
  }

  if (response_type !== 'code') {
    return res.status(400).json({ error: "unsupported_response_type", message: "Only response_type=code is supported" });
  }

  // 1. Verify Application
  let matchedApp = null;
  try {
    const result = await pool.query(
      `SELECT * FROM public.applications WHERE app_id = $1 AND is_active = true LIMIT 1`,
      [client_id]
    );
    if (result.rowCount > 0) {
      matchedApp = result.rows[0];
    }
  } catch (err) {
    console.error("Authorize DB Error:", err);
    return res.status(500).json({ error: "server_error" });
  }

  if (!matchedApp) {
    return res.status(400).json({ error: "unauthorized_client", message: "Invalid client_id" });
  }

  // 2. Validate Redirect URI
  // Simple check: redirect_uri must start with one of the allowed_origins
  const allowedOrigins = matchedApp.allowed_origins || [];
  const isAllowed = allowedOrigins.some(origin => redirect_uri.startsWith(origin));
  
  if (!isAllowed) {
    return res.status(400).json({ error: "invalid_request", message: "Redirect URI not allowed" });
  }

  // 3. Generate Authorization Code
  const code = generateAuthCode();
  
  try {
    await storeAuthCode(code, client_id, req.user.id, redirect_uri, scope);
  } catch (err) {
    console.error("Store Code Error:", err);
    return res.status(500).json({ error: "server_error" });
  }

  // 4. Return Redirect URL (Frontend will perform the redirect)
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }

  return res.json({ redirect_url: redirectUrl.toString() });
};

/**
 * OAuth 2.0 Token Endpoint (Public, but requires client_secret)
 * Exchanges Authorization Code for Access Token.
 */
export const token = async (req, res) => {
  const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: "unsupported_grant_type" });
  }

  if (!code || !redirect_uri || !client_id || !client_secret) {
    return res.status(400).json({ error: "invalid_request", message: "Missing required parameters" });
  }

  // 1. Verify Client Secret
  let matchedApp = null;
  try {
    const result = await pool.query(
      `SELECT * FROM public.applications WHERE app_id = $1 AND is_active = true LIMIT 1`,
      [client_id]
    );
    if (result.rowCount > 0) {
      matchedApp = result.rows[0];
    }
  } catch (err) {
    return res.status(500).json({ error: "server_error" });
  }

  if (!matchedApp || matchedApp.secret !== client_secret) {
    return res.status(401).json({ error: "invalid_client" });
  }

  // 2. Verify Authorization Code
  let authCodeRecord;
  try {
    authCodeRecord = await getAuthCode(code);
  } catch (err) {
    return res.status(500).json({ error: "server_error" });
  }

  if (!authCodeRecord) {
    return res.status(400).json({ error: "invalid_grant", message: "Invalid or expired code" });
  }

  if (authCodeRecord.client_id !== client_id) {
    return res.status(400).json({ error: "invalid_grant", message: "Code was issued to another client" });
  }

  if (authCodeRecord.redirect_uri !== redirect_uri) {
    return res.status(400).json({ error: "invalid_grant", message: "Redirect URI mismatch" });
  }

  // 3. Invalidate Code
  await invalidateAuthCode(code);

  // 4. Issue Tokens
  // Get User details
  let user;
  try {
    const userRes = await pool.query(`SELECT * FROM users WHERE id = $1`, [authCodeRecord.user_id]);
    if (userRes.rowCount === 0) {
      return res.status(400).json({ error: "invalid_grant", message: "User not found" });
    }
    user = userRes.rows[0];
  } catch (err) {
    return res.status(500).json({ error: "server_error" });
  }

  const accessToken = signToken({
    sub: String(user.id),
    name: user.name,
    email: user.email,
    isAdmin: user.is_admin,
    aud: client_id,
    iss: 'account.iasbt.com',
    scope: authCodeRecord.scope
  }, 3600, matchedApp.secret);

  const refreshToken = signToken({
    sub: user.id,
    type: 'refresh',
    aud: client_id
  }, 14 * 24 * 3600, matchedApp.secret);

  return res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authCodeRecord.scope
  });
};
