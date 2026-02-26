import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export const signToken = (payload, ttlSeconds, secret = config.ssoSecret) => {
  if (!secret) return null;
  try {
    return jwt.sign(payload, secret, { expiresIn: ttlSeconds });
  } catch (err) {
    console.error("Sign Token Error:", err);
    return null;
  }
};

export const verifyToken = (token, secret = config.ssoSecret) => {
  if (!secret) return null;
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

export const generateToken = (user) => {
  return signToken({ 
    sub: user.id, 
    name: user.username, 
    email: user.email,
    isAdmin: user.is_admin || false
  }, 7 * 24 * 60 * 60); // 7 days
};

