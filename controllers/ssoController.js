
import { createHash } from "crypto";
import pool from "../db.js";
import { config } from "../config/index.js";
import { signToken, verifyToken } from "../utils/token.js";
import { generateAuthCode, storeAuthCode, getAuthCode, invalidateAuthCode, verifyPkce } from "../utils/oauth.js";
import { auditLogger, AuditEvent } from "../services/auditLogger.js";

/**
 * @deprecated Legacy Implicit Flow (Use /oauth/authorize instead)
 * [Security V1.8.18] RESTORED temporarily to fix Gallery Login.
 * MUST be removed after Gallery migrates to OAuth 2.0.
 */
export const issueSsoToken = async (req, res) => {
  const { target } = req.query;

  if (!target) {
    return res.status(400).json({ error: "missing_target" });
  }

  try {
    // 1. Validate Target against Allowed Origins (Strict Match)
    const result = await pool.query(
      `SELECT * FROM public.applications WHERE $1 = ANY(allowed_origins) AND is_active = true LIMIT 1`,
      [target]
    );

    if (result.rowCount === 0) {
      console.warn(`[SSO-Legacy] Blocked invalid target: ${target}`);
      return res.status(403).json({ 
        error: "invalid_target", 
        message: "Target URL not allowed by any active application" 
      });
    }

    // 2. Generate Access Token (Implicit Flow)
    const token = signToken({
      sub: req.user.id || req.user.sub,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin || req.user.is_admin
    }, 3600); // 1 hour

    if (!token) {
      return res.status(500).json({ error: "token_generation_failed" });
    }

    // 3. Construct Redirect URL with Fragment
    const redirectUrl = new URL(target);
    // Append token to fragment as per Implicit Flow standard
    // Existing fragment is preserved and appended to? No, usually replaced or merged.
    // We'll just set it.
    const params = new URLSearchParams();
    params.set('access_token', token);
    params.set('token_type', 'Bearer');
    params.set('expires_in', '3600');
    
    redirectUrl.hash = params.toString();

    return res.json({ url: redirectUrl.toString() });

  } catch (err) {
    console.error("SSO Issue Error:", err);
    return res.status(500).json({ error: "server_error" });
  }
};

/**
 * OAuth 2.0 Authorization Endpoint (Protected by requireAuth)
 * Generates an Authorization Code for the client.
 */
export const authorize = async (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = req.body;
  
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
  // [Security V1.8.18] Use strict equality matching instead of startsWith to prevent domain spoofing
  const allowedOrigins = matchedApp.allowed_origins || [];
  const isAllowed = allowedOrigins.includes(redirect_uri);
  
  if (!isAllowed) {
    console.warn(`[SSO] Blocked invalid redirect_uri: ${redirect_uri} for app: ${client_id}`);
    return res.status(400).json({ error: "invalid_request", message: "Redirect URI not allowed (Strict Match Required)" });
  }

  // 3. Generate Authorization Code
  const code = generateAuthCode();
  
  try {
    // Store with PKCE challenge if provided
    await storeAuthCode(code, client_id, req.user.id, redirect_uri, scope, code_challenge, code_challenge_method);
  } catch (err) {
    console.error("Store Code Error Full:", err);
    return res.status(500).json({ error: "server_error", details: err.message });
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
 * OAuth 2.0 Token Endpoint
 * Exchanges Authorization Code for Access Token.
 * Supports: grant_type=authorization_code | refresh_token
 */
export const token = async (req, res) => {
  const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier, refresh_token } = req.body;

  // === 1. Verify Client ===
  // If client_secret is provided, verify it.
  // We allow public clients (no secret) if they used PKCE (checked later).
  // But we still need to validate client_id exists.
  let matchedApp = null;
  if (client_id) {
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
  }

  // Enforce secret check if app is confidential
  if (matchedApp && matchedApp.secret) {
     if (!client_secret || matchedApp.secret !== client_secret) {
        return res.status(401).json({ error: "invalid_client" });
     }
  } else if (!matchedApp) {
      // If client_id is invalid
      return res.status(401).json({ error: "invalid_client" });
  }

  // === 2. Handle 'authorization_code' ===
  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri) {
      return res.status(400).json({ error: "invalid_request", message: "Missing code or redirect_uri" });
    }

    // Verify Authorization Code
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

    // [Security] Verify PKCE
    if (authCodeRecord.code_challenge) {
      if (!code_verifier) {
         return res.status(400).json({ error: "invalid_request", message: "code_verifier is required" });
      }
      const isValid = verifyPkce(code_verifier, authCodeRecord.code_challenge, authCodeRecord.code_challenge_method);
      if (!isValid) {
        return res.status(400).json({ error: "invalid_grant", message: "PKCE verification failed" });
      }
    }

    // Invalidate Code
    await invalidateAuthCode(code);

    // Issue Tokens
    return issueTokens(res, authCodeRecord.user_id, client_id, authCodeRecord.scope);
  }

  // === 3. Handle 'refresh_token' ===
  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return res.status(400).json({ error: "invalid_request", message: "Missing refresh_token" });
    }

    // Verify Signature
    const payload = await verifyToken(refresh_token); // Uses RS256 Public Key
    if (!payload || payload.type !== 'refresh') {
      return res.status(400).json({ error: "invalid_grant", message: "Invalid refresh token" });
    }

    if (payload.aud !== client_id) {
      return res.status(400).json({ error: "invalid_grant", message: "Token issued to another client" });
    }

    // Verify against DB (Revocation Check)
    const tokenHash = createHash('sha256').update(refresh_token).digest('hex');
    try {
      const rtRes = await pool.query(
        `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
        [tokenHash]
      );
      
      if (rtRes.rowCount === 0) {
        // Token reuse detection? If token not found but signature valid, maybe it was rotated/revoked.
        // Ideally we should check if it was revoked.
        return res.status(400).json({ error: "invalid_grant", message: "Token revoked or expired" });
      }

      const oldRt = rtRes.rows[0];

      // Revoke Old Token (Rotation)
      await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE id = $1`, [oldRt.id]);

      // Issue New Tokens
      // Note: We might want to persist the original scope?
      // For now, assume default 'profile' or fetch user's allowed scope.
      return issueTokens(req, res, payload.sub, client_id, 'profile');

    } catch (err) {
      console.error("Refresh Token DB Error:", err);
      return res.status(500).json({ error: "server_error" });
    }
  }

  return res.status(400).json({ error: "unsupported_grant_type" });
};

// Helper to Issue Access & Refresh Tokens
const issueTokens = async (req, res, userId, clientId, scope) => {
  let user;
  try {
    const userRes = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    if (userRes.rowCount === 0) {
      return res.status(400).json({ error: "invalid_grant", message: "User not found" });
    }
    user = userRes.rows[0];
  } catch (err) {
    return res.status(500).json({ error: "server_error" });
  }

  // Audit Log (SSO Attempt)
  // We log here to capture both initial login and refresh
  auditLogger.log(AuditEvent.SSO_AUTH, req, { client_id: clientId, scope }, user.id);

  // Access Token (Short-lived: 15 mins)
  const accessToken = signToken({
    sub: String(user.id),
    name: user.name,
    email: user.email,
    isAdmin: user.is_admin,
    aud: clientId,
    iss: 'account.iasbt.com',
    scope: scope
  }, config.ssoTokenTtl); 

  // Refresh Token (Long-lived: 14 days)
  const refreshTokenTtl = 14 * 24 * 3600;
  const refreshToken = signToken({
    sub: String(user.id),
    type: 'refresh',
    aud: clientId
  }, refreshTokenTtl);

  // Store Refresh Token Hash in DB
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + refreshTokenTtl * 1000);

  try {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, client_id) VALUES ($1, $2, $3, $4)`,
      [user.id, tokenHash, expiresAt, clientId]
    );
  } catch (err) {
    console.error("Store Refresh Token Error:", err);
    return res.status(500).json({ error: "server_error" });
  }

  return res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: config.ssoTokenTtl,
    refresh_token: refreshToken,
    scope: scope
  });
};
