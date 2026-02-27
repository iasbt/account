import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  ssoSecret: process.env.SSO_JWT_SECRET || "",
  jwt: {
    privateKey,
    publicKey,
    algorithm: privateKey ? "RS256" : "HS256"
  },
  ssoTokenTtl: Number(process.env.SSO_TOKEN_TTL || 900), // 15 minutes (Access Token)
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
