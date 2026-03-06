import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

// Helper to get signing key/secret based on algorithm
const getSigningKey = () => {
  if (config.jwt.algorithm === "RS256") {
    return config.jwt.privateKey;
  }
  return config.ssoSecret;
};

// Helper to get verification key/secret based on algorithm
const getVerificationKey = () => {
  if (config.jwt.algorithm === "RS256") {
    return config.jwt.publicKey;
  }
  return config.ssoSecret;
};

export const verifyAppToken = async (token) => {
  try {
    // 1. Verify Signature
    // If RS256, use Public Key. If HS256, use Secret.
    // Note: We removed the logic that looked up App Secret based on 'aud'.
    // Reason: All tokens issued by Account Service should be signed by Account Service (Private Key or SSO Secret).
    // App Secrets are only for Client Credentials or specific App-signed tokens (not supported here).
    
    return jwt.verify(token, getVerificationKey(), { algorithms: [config.jwt.algorithm] });
  } catch (err) {
    logger.error({ event: "verify_app_token_failed", error: err.message });
    return null;
  }
};

export const signToken = (payload, ttlSeconds, secret = null) => {
  const signingKey = secret || getSigningKey();
  if (!signingKey) return null;
  
  try {
    return jwt.sign(payload, signingKey, { 
      expiresIn: ttlSeconds,
      algorithm: config.jwt.algorithm
    });
  } catch (err) {
    logger.error({ event: "sign_token_error", error: err.message });
    return null;
  }
};

export const verifyToken = async (token, secret = null) => {
  const verificationKey = secret || getVerificationKey();
  if (!verificationKey) return null;
  
  try {
    return jwt.verify(token, verificationKey, { algorithms: [config.jwt.algorithm] });
  } catch (_err) {
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

