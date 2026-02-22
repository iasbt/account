import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  logLevel: process.env.LOG_LEVEL || "info",
  ssoSecret: process.env.SSO_JWT_SECRET || "",
  ssoTokenTtl: Number(process.env.SSO_TOKEN_TTL || 300),
  corsAllowlist: process.env.CORS_ALLOWLIST || process.env.CORS_ORIGIN || "",
  ssoRedirectAllowlist: process.env.SSO_REDIRECT_ALLOWLIST || "",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  redis: {
    host: process.env.REDIS_HOST || "redis",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
};
