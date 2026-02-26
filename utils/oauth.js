import pool from "../db.js";
import { randomBytes } from "crypto";

// Generate a random code
export const generateAuthCode = () => {
  return randomBytes(16).toString("hex");
};

// Store auth code in database
export const storeAuthCode = async (code, clientId, userId, redirectUri, scope = "profile", expiresInSeconds = 600) => {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  
  await pool.query(
    `INSERT INTO oauth_codes (code, client_id, user_id, redirect_uri, scope, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [code, clientId, userId, redirectUri, scope, expiresAt]
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
