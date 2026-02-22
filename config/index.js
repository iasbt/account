import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  logLevel: process.env.LOG_LEVEL || "info",
  ssoSecret: process.env.SSO_JWT_SECRET || "",
  ssoTokenTtl: Number(process.env.SSO_TOKEN_TTL || 300),
  corsAllowlist: process.env.CORS_ALLOWLIST || process.env.CORS_ORIGIN || "",
  ssoRedirectAllowlist: process.env.SSO_REDIRECT_ALLOWLIST || "",
};
