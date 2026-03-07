import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Load keys
let privateKey = null;
let publicKey = null;
try {
  const certsDir = path.join(__dirname, "../certs");
  if (fs.existsSync(path.join(certsDir, "private.pem"))) {
    privateKey = fs.readFileSync(path.join(certsDir, "private.pem"), "utf8");
    publicKey = fs.readFileSync(path.join(certsDir, "public.pem"), "utf8");
  }
} catch (e) {
  console.warn("Failed to load RSA keys:", e.message);
}

export const config = {
  port: Number(process.env.PORT || 3000),
  logLevel: process.env.LOG_LEVEL || "info",
  ssoSecret: (() => {
    const secret = process.env.SSO_JWT_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("FATAL: SSO_JWT_SECRET is missing in production environment.");
    }
    return secret || "dev_secret_do_not_use_in_prod";
  })(),
  jwt: {
    privateKey,
    publicKey,
    algorithm: "RS256"
  },
  ssoTokenTtl: Number(process.env.SSO_TOKEN_TTL || 900), // 15 minutes (Access Token)
  corsAllowlist: process.env.CORS_ALLOWLIST || process.env.CORS_ORIGIN || "",
  ssoRedirectAllowlist: process.env.SSO_REDIRECT_ALLOWLIST || "",
  oidc: {
    issuer: process.env.OIDC_ISSUER || process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`,
    internalClientId: process.env.OIDC_INTERNAL_CLIENT_ID || "account-web",
    internalRedirectUri: process.env.OIDC_INTERNAL_REDIRECT_URI || process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`,
    accessTokenTtl: Number(process.env.OIDC_ACCESS_TOKEN_TTL || 900),
    authorizationCodeTtl: Number(process.env.OIDC_AUTH_CODE_TTL || 60),
    refreshTokenTtl: Number(process.env.OIDC_REFRESH_TOKEN_TTL || 1209600),
    externalIssuer: logtoIssuer,
    externalJwksUrl: logtoJwksUrl,
    externalAudience: logtoAudience,
    cookieKeys: (process.env.OIDC_COOKIE_KEYS || process.env.SSO_JWT_SECRET || "dev_secret_do_not_use_in_prod")
      .split(",")
      .filter(Boolean)
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
