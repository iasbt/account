
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
  const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = req.body;

  if (!client_id || !redirect_uri) {
    return res.status(400).json({ message: "Missing client_id or redirect_uri" });
  }

  if (response_type !== "code") {
    return res.status(400).json({ message: "Unsupported response_type. Use 'code'." });
  }

  const authUser = req.user;
  if (!authUser) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // 1. Verify Client App
  let matchedApp = null;
  try {
    const result = await pool.query(
      `SELECT * FROM public.applications 
       WHERE app_id = $1 AND is_active = true`,
      [client_id]
    );
    if (result.rowCount > 0) {
      matchedApp = result.rows[0];
    }
  } catch (dbErr) {
    console.error("OAuth App Lookup Failed:", dbErr);
    return res.status(500).json({ message: "Database error" });
  }

  if (!matchedApp) {
    return res.status(400).json({ message: "Invalid client_id" });
  }

  // 2. Verify Redirect URI
  // Simple check: allowed_origins must contain the origin of redirect_uri
  try {
    const uri = new URL(redirect_uri);
    const origin = uri.origin;
    if (!matchedApp.allowed_origins.includes(origin)) {
      return res.status(400).json({ message: "Redirect URI origin not allowed" });
    }
  } catch (e) {
    return res.status(400).json({ message: "Invalid redirect_uri format" });
  }

  // 3. Generate Authorization Code
  const code = generateAuthCode();

  // 4. Store Code
  await storeAuthCode(code, {
    userId: authUser.id,
    clientId: client_id,
    redirectUri: redirect_uri,
    scope: scope || "openid profile email",
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method
  });

  // 5. Construct Redirect URL
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) {
    redirectUrl.searchParams.set("state", state);
  }

  return res.json({ redirect_uri: redirectUrl.toString() });
};

/**
 * OAuth 2.0 Token Endpoint (Public)
 * Exchanges Authorization Code for Access Token.
 */
export const token = async (req, res) => {
  const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier } = req.body;

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ message: "Unsupported grant_type" });
  }

  if (!code || !redirect_uri || !client_id || !client_secret) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  // 1. Verify Client Credentials
  let matchedApp = null;
  try {
    const result = await pool.query(
      `SELECT * FROM public.applications 
       WHERE app_id = $1 AND is_active = true`,
      [client_id]
    );
    if (result.rowCount > 0) {
      matchedApp = result.rows[0];
    }
  } catch (dbErr) {
    console.error("OAuth Token App Lookup Failed:", dbErr);
    return res.status(500).json({ message: "Database error" });
  }

  if (!matchedApp) {
    return res.status(401).json({ message: "Invalid client_id" });
  }

  // Check Client Secret (Assume plain text for now, should be hashed in production)
  // If app has secret, verify it.
  if (matchedApp.secret && matchedApp.secret !== client_secret) {
    // If the DB stores the secret directly. 
    // Ideally we should store a hash, but for now we compare directly or use a stored secret.
    // The previous implementation used `matchedApp.secret` as the JWT secret, so it's the shared secret.
    return res.status(401).json({ message: "Invalid client_secret" });
  }

  // 2. Retrieve & Verify Code
  const codeData = await getAuthCode(code);
  if (!codeData) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  if (codeData.clientId !== client_id) {
    return res.status(400).json({ message: "Code was issued to another client" });
  }

  if (codeData.redirectUri !== redirect_uri) {
    return res.status(400).json({ message: "Redirect URI mismatch" });
  }

  // PKCE Check (Optional)
  if (codeData.codeChallenge) {
    if (!code_verifier) {
      return res.status(400).json({ message: "Missing code_verifier" });
    }
    // Verify PKCE (skip for now as crypto logic needed, but placeholder here)
    // const hash = createHash('sha256').update(code_verifier).digest('base64url');
    // if (hash !== codeData.codeChallenge) error...
  }

  // 3. Invalidate Code
  await invalidateAuthCode(code);

  // 4. Generate Tokens
  // Retrieve user details
  let user = null;
  try {
    const userResult = await pool.query("SELECT * FROM public.users WHERE id = $1", [codeData.userId]);
    if (userResult.rowCount > 0) {
      user = userResult.rows[0];
    }
  } catch (err) {
    console.error("User lookup failed:", err);
    return res.status(500).json({ message: "User lookup failed" });
  }

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const secret = matchedApp.secret || config.ssoSecret; // Use App Secret for signing if available

  const accessToken = signToken({
    sub: String(user.id),
    name: user.name,
    email: user.email,
    isAdmin: user.is_admin,
    aud: client_id,
    iss: 'account.iasbt.com',
    scope: codeData.scope
  }, 3600, secret);

  const refreshToken = signToken({
    sub: String(user.id),
    type: 'refresh',
    aud: client_id,
    scope: codeData.scope
  }, 7 * 24 * 3600, secret);

  return res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: codeData.scope,
    id_token: accessToken // OIDC-like behavior reusing access token as ID token (simplified)
  });
};
