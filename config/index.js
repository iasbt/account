import dotenv from "dotenv";
dotenv.config();

const normalizeUrl = (value) => {
  if (!value) return "";
  return value.trim().replace(/^`|`$/g, "").replace(/\/$/, "");
};

const normalizeOidcIssuer = (value) => {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";
  return normalized.endsWith("/oidc") ? normalized : `${normalized}/oidc`;
};

const logtoBaseUrl = normalizeUrl(process.env.LOGTO_BASE_URL || process.env.LOGTO_PUBLIC_URL || process.env.LOGTO_URL || "");
const logtoIssuer = normalizeOidcIssuer(process.env.LOGTO_ISSUER || process.env.OIDC_EXTERNAL_ISSUER || process.env.AUTHENTIK_ISSUER || logtoBaseUrl);
const logtoJwksUrl = normalizeUrl(process.env.LOGTO_JWKS_URL || process.env.OIDC_EXTERNAL_JWKS_URL || process.env.AUTHENTIK_JWKS_URL || (logtoIssuer ? `${logtoIssuer}/jwks` : ""));
const logtoAudience = normalizeUrl(process.env.LOGTO_AUDIENCE || process.env.OIDC_EXTERNAL_AUDIENCE || process.env.AUTHENTIK_AUDIENCE || "");
const logtoEndSessionEndpoint = normalizeUrl(process.env.LOGTO_END_SESSION_ENDPOINT || (logtoBaseUrl ? `${logtoBaseUrl}/oidc/session/end` : ""));
const publicUrl = normalizeUrl(process.env.ACCOUNT_PUBLIC_URL || process.env.PUBLIC_URL || "");
if (process.env.NODE_ENV === "production") {
  if (!logtoIssuer) throw new Error("FATAL: LOGTO_ISSUER is missing in production environment.");
  if (!logtoJwksUrl) throw new Error("FATAL: LOGTO_JWKS_URL is missing in production environment.");
}

export const config = {
  port: Number(process.env.PORT || 3000),
  logLevel: process.env.LOG_LEVEL || "info",
  corsAllowlist: process.env.CORS_ALLOWLIST || process.env.CORS_ORIGIN || "",
  ssoRedirectAllowlist: process.env.SSO_REDIRECT_ALLOWLIST || "",
  publicUrl,
  logto: {
    baseUrl: logtoBaseUrl,
    issuer: logtoIssuer,
    jwksUrl: logtoJwksUrl,
    audience: logtoAudience,
    endSessionEndpoint: logtoEndSessionEndpoint
  },
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
  galleryHost: process.env.GALLERY_HOST || "http://119.91.71.30",
  debugAllowlist: (process.env.DEBUG_ALLOWLIST || "").split(",").filter(Boolean),
  allowedDomains: (process.env.ALLOWED_DOMAINS || ".iasbt.cloud,localhost,127.0.0.1").split(",").filter(Boolean)
};
