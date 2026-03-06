
import { config } from "../config/index.js";
import { createPublicKey } from "crypto";

let jwksCache = null;

export const getJwks = (req, res) => {
  if (jwksCache) {
    return res.json(jwksCache);
  }

  if (!config.jwt.publicKey) {
    return res.status(503).json({ error: "service_unavailable", message: "Public Key not configured" });
  }

  try {
    const publicKey = createPublicKey(config.jwt.publicKey);
    const jwk = publicKey.export({ format: "jwk" });
    
    // Add required fields for JWKS
    jwk.use = "sig";
    jwk.alg = "RS256";
    jwk.kid = "account-key-1"; // Key ID (should be rotated properly, but hardcoded for now)

    jwksCache = { keys: [jwk] };
    return res.json(jwksCache);
  } catch (err) {
    console.error("JWKS Error:", err);
    return res.status(500).json({ error: "server_error" });
  }
};

export const getOpenIdConfiguration = (req, res) => {
  const baseUrl = process.env.ACCOUNT_PUBLIC_URL || process.env.BASE_URL || "https://iasbt.cloud";
  
  return res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"], // none for PKCE public clients
    claims_supported: ["sub", "iss", "name", "email", "is_admin"]
  });
};
