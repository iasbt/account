import jwt from "jsonwebtoken";
import pool from "../db.js";
import { config } from "../config/index.js";
import { isBlacklisted } from "./redis.js";

export const verifyAppToken = async (token) => {
  try {
    // 0. Check blacklist first
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      console.warn("Token is blacklisted");
      return null;
    }

    // 1. Decode without verifying signature to get aud (App ID)
    const decoded = jwt.decode(token);
    if (!decoded) return null;

    let secret = config.ssoSecret;

    // 2. If aud exists, lookup App Secret
    if (decoded.aud) {
      // If aud is array, take the first one or handle appropriately. 
      // Usually aud is string in our case.
      const appId = Array.isArray(decoded.aud) ? decoded.aud[0] : decoded.aud;
      
      const result = await pool.query(
        "SELECT secret FROM applications WHERE app_id = $1 LIMIT 1",
        [appId]
      );
      if (result.rowCount > 0 && result.rows[0].secret) {
        secret = result.rows[0].secret;
      }
    }

    // 3. Verify with the correct secret
    return jwt.verify(token, secret);
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return null;
  }
};

export const signToken = (payload, ttlSeconds, secret = config.ssoSecret) => {
  if (!secret) return null;
  try {
    return jwt.sign(payload, secret, { expiresIn: ttlSeconds });
  } catch (err) {
    console.error("Sign Token Error:", err);
    return null;
  }
};

export const verifyToken = async (token, secret = config.ssoSecret) => {
  if (!secret) return null;
  try {
    // Check blacklist
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      console.warn("Token is blacklisted");
      return null;
    }
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

export const generateToken = (user) => {
  return signToken({ 
    sub: user.id, 
    name: user.name || user.username, 
    email: user.email,
    isAdmin: user.is_admin || false
  }, 7 * 24 * 60 * 60); // 7 days
};

