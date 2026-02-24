import crypto from "node:crypto";
import { config } from "../config/index.js";

export const signToken = (payload, ttlSeconds, secret = config.ssoSecret) => {
  if (!secret) return null;
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const headerPart = Buffer.from(JSON.stringify(header)).toString("base64url");
  const bodyPart = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerPart}.${bodyPart}`)
    .digest("base64url");
  return `${headerPart}.${bodyPart}.${signature}`;
};

export const verifyToken = (token, secret = config.ssoSecret) => {
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, bodyPart, signature] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${headerPart}.${bodyPart}`)
    .digest("base64url");
  if (signature !== expected) return null;
  const body = JSON.parse(Buffer.from(bodyPart, "base64url").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (!body.exp || body.exp < now) return null;
  return body;
};

export const generateToken = (user) => {
  return signToken({ 
    sub: user.id, 
    name: user.username, 
    email: user.email,
    isAdmin: user.is_admin || false
  }, 7 * 24 * 60 * 60); // 7 days
};

export const generateSsoToken = (user) => {
  return signToken({ 
    sub: user.id, 
    name: user.username, 
    email: user.email,
    type: 'sso'
  }, 5 * 60); // 5 minutes
};

export const generateSupabaseToken = (user, secret = config.ssoSecret) => {
  // Supabase/GoTrue Standard Claims
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour

  // Note: user.id in legacy_users is Integer, but Supabase usually expects UUID.
  // Ideally we should cast/hash this to UUID, but for now we pass string.
  // If Gallery uses RLS on auth.uid(), this might mismatch if it expects UUID format.
  
  return signToken({
    aud: "authenticated",
    role: "authenticated",
    sub: String(user.id),
    email: user.email,
    phone: "",
    app_metadata: {
      provider: "email",
      providers: ["email"]
    },
    user_metadata: {
      name: user.username,
      email: user.email,
      is_admin: user.isAdmin || false
    },
    iat: now,
    exp: exp
  }, 3600, secret);
};
