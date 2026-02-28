import pool from "../config/db.js";
import { randomBytes, createHash } from "crypto";

// Generate a random code
export const generateAuthCode = () => {
  return randomBytes(16).toString("hex");
};

// Store auth code in database (Added PKCE Support)
export const storeAuthCode = async (code, clientId, userId, redirectUri, scope = "profile", codeChallenge = null, codeChallengeMethod = null, expiresInSeconds = 600) => {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  
  await pool.query(
    `INSERT INTO oauth_codes (code, client_id, user_id, redirect_uri, scope, expires_at, code_challenge, code_challenge_method)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [code, clientId, userId, redirectUri, scope, expiresAt, codeChallenge, codeChallengeMethod]
  );
  
  return code;
};

// Retrieve and validate auth code
export const getAuthCode = async (code) => {
  const result = await pool.query(
    `SELECT * FROM oauth_codes WHERE code = $1 AND used = false AND expires_at > NOW()`,
    [code]
  );
  
  if (result.rowCount === 0) return null;
  return result.rows[0];
};

// Invalidate auth code (mark as used)
export const invalidateAuthCode = async (code) => {
  await pool.query(
    `UPDATE oauth_codes SET used = true WHERE code = $1`,
    [code]
  );
};

// Verify PKCE Challenge
export const verifyPkce = (codeVerifier, codeChallenge, codeChallengeMethod) => {
  if (!codeChallenge) return true; // No PKCE used
  if (!codeVerifier) return false; // PKCE required but verifier missing

  if (codeChallengeMethod === 'S256') {
    const hash = createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return hash === codeChallenge;
  }
  
  // Fallback to plain
  return codeVerifier === codeChallenge;
};
