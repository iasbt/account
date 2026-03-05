import Provider from "oidc-provider";
import jwt from "jsonwebtoken";
import { createPrivateKey, createPublicKey, generateKeyPairSync } from "crypto";
import pool from "../config/db.js";
import { config } from "../config/index.js";

const fallbackIssuer = `http://localhost:${process.env.PORT || 3000}`;
const oidcConfig = {
  issuer: config?.oidc?.issuer || fallbackIssuer,
  internalClientId: config?.oidc?.internalClientId || "account-web",
  internalRedirectUri: config?.oidc?.internalRedirectUri || fallbackIssuer,
  accessTokenTtl: config?.oidc?.accessTokenTtl ?? 900,
  authorizationCodeTtl: config?.oidc?.authorizationCodeTtl ?? 60,
  refreshTokenTtl: config?.oidc?.refreshTokenTtl ?? 1209600,
  cookieKeys: Array.isArray(config?.oidc?.cookieKeys) && config.oidc.cookieKeys.length > 0
    ? config.oidc.cookieKeys
    : [config?.ssoSecret || "dev_secret_do_not_use_in_prod"]
};

const ensureOidcSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.oidc (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload JSONB NOT NULL,
      grant_id TEXT,
      user_code TEXT,
      uid TEXT,
      expires_at TIMESTAMPTZ,
      consumed_at TIMESTAMPTZ
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS oidc_type_idx ON public.oidc (type);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS oidc_expires_at_idx ON public.oidc (expires_at);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS oidc_grant_id_idx ON public.oidc (grant_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS oidc_user_code_idx ON public.oidc (user_code);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS oidc_uid_idx ON public.oidc (uid);`);
};

class OidcAdapter {
  constructor(name) {
    this.name = name;
  }

  async upsert(id, payload, expiresIn) {
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    try {
      await pool.query(
        `INSERT INTO public.oidc (id, type, payload, grant_id, user_code, uid, expires_at, consumed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
         ON CONFLICT (id) DO UPDATE SET
           payload = EXCLUDED.payload,
           grant_id = EXCLUDED.grant_id,
           user_code = EXCLUDED.user_code,
           uid = EXCLUDED.uid,
           expires_at = EXCLUDED.expires_at,
           consumed_at = NULL`,
        [
          id,
          this.name,
          JSON.stringify(payload),
          payload.grantId || null,
          payload.userCode || null,
          payload.uid || null,
          expiresAt
        ]
      );
    } catch (_error) {
    }
  }

  async find(id) {
    let result = null;
    try {
      result = await pool.query(
        `SELECT payload, consumed_at, expires_at FROM public.oidc WHERE id = $1 AND type = $2`,
        [id, this.name]
      );
    } catch (_error) {
      result = null;
    }
    if (!result || result.rowCount === 0) return undefined;
    const row = result.rows[0];
    const payload = row.payload;
    if (row.consumed_at) payload.consumed = true;
    return payload;
  }

  async findByUserCode(userCode) {
    let result = null;
    try {
      result = await pool.query(
        `SELECT payload, consumed_at FROM public.oidc WHERE user_code = $1 AND type = $2`,
        [userCode, this.name]
      );
    } catch (_error) {
      result = null;
    }
    if (!result || result.rowCount === 0) return undefined;
    const row = result.rows[0];
    const payload = row.payload;
    if (row.consumed_at) payload.consumed = true;
    return payload;
  }

  async findByUid(uid) {
    let result = null;
    try {
      result = await pool.query(
        `SELECT payload, consumed_at FROM public.oidc WHERE uid = $1 AND type = $2`,
        [uid, this.name]
      );
    } catch (_error) {
      result = null;
    }
    if (!result || result.rowCount === 0) return undefined;
    const row = result.rows[0];
    const payload = row.payload;
    if (row.consumed_at) payload.consumed = true;
    return payload;
  }

  async consume(id) {
    try {
      await pool.query(
        `UPDATE public.oidc SET consumed_at = NOW() WHERE id = $1 AND type = $2`,
        [id, this.name]
      );
    } catch (_error) {
    }
  }

  async destroy(id) {
    try {
      await pool.query(
        `DELETE FROM public.oidc WHERE id = $1 AND type = $2`,
        [id, this.name]
      );
    } catch (_error) {
    }
  }

  async revokeByGrantId(grantId) {
    try {
      await pool.query(
        `DELETE FROM public.oidc WHERE grant_id = $1 AND type = $2`,
        [grantId, this.name]
      );
    } catch (_error) {
    }
  }
}

let generatedKeyPair = null;

const getGeneratedKeyPair = () => {
  if (generatedKeyPair) return generatedKeyPair;
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  generatedKeyPair = {
    privateKey: privateKey.export({ format: "pem", type: "pkcs1" }).toString(),
    publicKey: publicKey.export({ format: "pem", type: "pkcs1" }).toString()
  };
  return generatedKeyPair;
};

const buildJwks = () => {
  const jwtConfig = config.jwt || {};
  const privateKey = jwtConfig.privateKey || getGeneratedKeyPair().privateKey;
  const jwk = createPrivateKey(privateKey).export({ format: "jwk" });
  return { keys: [{ ...jwk, use: "sig", alg: "RS256", kid: "account-rs256" }] };
};

const loadClients = async () => {
  let rows = [];
  try {
    const result = await pool.query(
      `SELECT app_id, allowed_origins, secret, is_active FROM public.applications WHERE is_active = TRUE`
    );
    rows = Array.isArray(result?.rows) ? result.rows : [];
  } catch (_error) {
    rows = [];
  }

  const clients = rows.map((row) => ({
    client_id: row.app_id,
    client_secret: row.secret || undefined,
    redirect_uris: Array.isArray(row.allowed_origins) ? row.allowed_origins : [],
    token_endpoint_auth_method: row.secret ? "client_secret_post" : "none",
    response_types: ["code"],
    grant_types: ["authorization_code", "refresh_token"]
  }));

  if (!clients.find((client) => client.client_id === oidcConfig.internalClientId)) {
    clients.push({
      client_id: oidcConfig.internalClientId,
      redirect_uris: [oidcConfig.internalRedirectUri],
      token_endpoint_auth_method: "none",
      response_types: ["code"],
      grant_types: ["authorization_code", "refresh_token"]
    });
  }

  return clients;
};

const hasAdminAccountEmail = async (email) => {
  if (!email) return false;
  try {
    const result = await pool.query(
      "SELECT 1 FROM public.admin_accounts WHERE email = $1 LIMIT 1",
      [email]
    );
    return result.rowCount > 0;
  } catch (_error) {
    return false;
  }
};

try {
  await ensureOidcSchema();
} catch (_error) {
}
const clients = await loadClients();

export const oidcProvider = new Provider(oidcConfig.issuer, {
  adapter: OidcAdapter,
  clients,
  jwks: buildJwks(),
  interactions: {
    url: (_ctx, interaction) => `/api/interaction/${interaction.uid}`
  },
  routes: {
    authorization: "/oauth/authorize",
    token: "/oauth/token",
    jwks: "/.well-known/jwks.json",
    discovery: "/.well-known/openid-configuration"
  },
  cookies: {
    keys: oidcConfig.cookieKeys
  },
  formats: {
    AccessToken: "jwt"
  },
  ttl: {
    AccessToken: oidcConfig.accessTokenTtl,
    AuthorizationCode: oidcConfig.authorizationCodeTtl,
    RefreshToken: oidcConfig.refreshTokenTtl
  },
  features: {
    devInteractions: { enabled: false }
  },
  claims: {
    openid: ["sub"],
    profile: ["name"],
    email: ["email"]
  },
  async findAccount(_ctx, accountId) {
    const userResult = await pool.query(
      "SELECT id, name, email, is_admin FROM public.users WHERE id = $1",
      [accountId]
    );
    const legacyResult = await pool.query(
      "SELECT id, username as name, email, is_admin FROM public.legacy_users WHERE id = $1",
      [accountId]
    );
    const user = userResult.rowCount ? userResult.rows[0] : legacyResult.rows[0];
    if (!user) return undefined;
    const hasAdminAccess = user.name === "admin"
      && (await hasAdminAccountEmail(user.email) || Boolean(user.is_admin));
    return {
      accountId,
      async claims() {
        return {
          sub: user.id,
          name: user.name,
          email: user.email,
          is_admin: hasAdminAccess
        };
      }
    };
  }
});

export const issueAccessToken = async (accountId) => {
  const client = await oidcProvider.Client.find(oidcConfig.internalClientId);
  if (!client) {
    throw new Error("OIDC internal client not configured");
  }
  const token = new oidcProvider.AccessToken({
    accountId,
    client,
    scope: "openid profile email"
  });
  if (typeof token.setAudiences === "function") {
    token.setAudiences([client.clientId]);
  } else {
    token.aud = [client.clientId];
  }
  return await token.save();
};

let externalJwksCache = {
  expiresAt: 0,
  keys: []
};

const loadExternalJwks = async () => {
  const jwksUrl = config?.oidc?.externalJwksUrl;
  if (!jwksUrl) return null;
  const now = Date.now();
  if (externalJwksCache.expiresAt > now && externalJwksCache.keys.length > 0) {
    return externalJwksCache;
  }
  try {
    const res = await fetch(jwksUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.keys)) return null;
    externalJwksCache = {
      expiresAt: now + 10 * 60 * 1000,
      keys: data.keys
    };
    return externalJwksCache;
  } catch (_error) {
    return null;
  }
};

const getExternalVerificationKey = async (kid) => {
  const cache = await loadExternalJwks();
  if (!cache) return null;
  const keys = cache.keys;
  const key = kid ? keys.find((k) => k.kid === kid) : keys[0];
  if (!key) return null;
  try {
    return createPublicKey({ key, format: "jwk" });
  } catch (_error) {
    return null;
  }
};

const isExternalIssuer = (payload) => {
  const issuer = config?.oidc?.externalIssuer;
  return Boolean(issuer && payload?.iss === issuer);
};

export const verifyAccessToken = async (token) => {
  const decoded = jwt.decode(token, { complete: true });
  if (decoded && isExternalIssuer(decoded.payload)) {
    const key = await getExternalVerificationKey(decoded.header?.kid);
    if (!key) return null;
    try {
      const issuer = config?.oidc?.externalIssuer;
      const audience = config?.oidc?.externalAudience || undefined;
      return jwt.verify(token, key, {
        algorithms: ["RS256"],
        issuer,
        audience
      });
    } catch (_error) {
      return null;
    }
  }

  const algorithm = config.jwt?.algorithm || "RS256";
  const key = algorithm === "RS256"
    ? (config.jwt?.publicKey || getGeneratedKeyPair().publicKey)
    : (config.ssoSecret || "dev_secret_do_not_use_in_prod");
  try {
    return jwt.verify(token, key, {
      algorithms: [algorithm],
      issuer: oidcConfig.issuer
    });
  } catch (_error) {
    try {
      const opaqueToken = await oidcProvider.AccessToken.find(token);
      if (!opaqueToken || !opaqueToken.accountId) return null;
      const account = await oidcProvider.Account.findAccount(undefined, opaqueToken.accountId);
      if (!account) return null;
      const claims = await account.claims("access_token", opaqueToken.scope || "openid profile email");
      return {
        ...claims,
        sub: claims.sub || opaqueToken.accountId
      };
    } catch (_opaqueError) {
      return null;
    }
  }
};
