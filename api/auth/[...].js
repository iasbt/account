import bcryptjs from "bcryptjs";
import crypto from "node:crypto";
import pool from "../../db.js";
import { sendCode } from "../../emailService.js";

const ssoSecret = process.env.SSO_JWT_SECRET || "";
const ssoTokenTtlSeconds = Number(process.env.SSO_TOKEN_TTL || 300);
const ssoTokenStore = new Map();

const signToken = (payload, ttlSeconds) => {
  if (!ssoSecret) return null;
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const headerPart = Buffer.from(JSON.stringify(header)).toString("base64url");
  const bodyPart = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ssoSecret)
    .update(`${headerPart}.${bodyPart}`)
    .digest("base64url");
  return `${headerPart}.${bodyPart}.${signature}`;
};

const verifyToken = (token) => {
  if (!ssoSecret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, bodyPart, signature] = parts;
  const expected = crypto
    .createHmac("sha256", ssoSecret)
    .update(`${headerPart}.${bodyPart}`)
    .digest("base64url");
  if (signature !== expected) return null;
  const body = JSON.parse(Buffer.from(bodyPart, "base64url").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (!body.exp || body.exp < now) return null;
  return body;
};

const getAuthUser = (req) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return verifyToken(token);
};

const cleanupSsoTokens = () => {
  const now = Date.now();
  for (const [token, item] of ssoTokenStore.entries()) {
    if (item.expiresAt <= now) {
      ssoTokenStore.delete(token);
    }
  }
};

const readJsonBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export default async function handler(req, res) {
  const slugValue = req.query?.slug;
  const path = Array.isArray(slugValue) ? `/${slugValue.join("/")}` : `/${slugValue || ""}`;

  if (req.method === "POST" && path === "/send-code") {
    const body = await readJsonBody(req);
    const { email } = body || {};
    if (!email) {
      return res.status(400).json({ message: "邮箱不能为空", success: false });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    try {
      await pool.query(
        "INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)",
        [email, code, expiresAt]
      );
      await sendCode(email, code);
      return res.json({ message: "验证码发送成功", success: true });
    } catch (error) {
      console.error("Send code error", error);
      return res.status(500).json({ message: "验证码发送失败", success: false });
    }
  }

  if (req.method === "POST" && path === "/register") {
    const body = await readJsonBody(req);
    const { email, code, password, name } = body || {};
    if (!email || !code || !password || !name) {
      return res.status(400).json({ message: "参数不完整", success: false });
    }
    try {
      const codeResult = await pool.query(
        "SELECT id FROM verification_codes WHERE email = $1 AND code = $2 AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [email, code]
      );
      if (codeResult.rowCount === 0) {
        return res.status(400).json({ message: "验证码无效或已过期", success: false });
      }
      const userResult = await pool.query(
        "SELECT id FROM public.legacy_users WHERE email = $1 LIMIT 1",
        [email]
      );
      if (userResult.rowCount > 0) {
        return res.status(400).json({ message: "邮箱已注册", success: false });
      }
      const salt = await bcryptjs.genSalt(10);
      const passwordHash = await bcryptjs.hash(password, salt);
      const userId = crypto.randomUUID();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO public.legacy_users
            (id, email, password_hash, username, created_at, updated_at, has_accepted_upload_terms, has_seen_onboarding)
           VALUES ($1, $2, $3, $4, NOW(), NOW(), FALSE, FALSE)`,
          [userId, email, passwordHash, name]
        );
        await client.query("UPDATE verification_codes SET is_used = TRUE WHERE id = $1", [
          codeResult.rows[0].id,
        ]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Register transaction error", error);
        return res.status(500).json({ message: "注册失败", success: false });
      } finally {
        client.release();
      }
      const token = signToken(
        { sub: userId, email, name, displayName: name, avatar: "", isAdmin: false },
        60 * 60 * 12
      );
      return res.json({
        message: "注册成功！",
        success: true,
        token,
        user: { id: userId, email, name, displayName: name, avatar: "", isAdmin: false },
      });
    } catch (error) {
      console.error("Register error", error);
      return res.status(500).json({ message: "注册失败", success: false });
    }
  }

  if (req.method === "POST" && path === "/login") {
    const body = await readJsonBody(req);
    const { account, password } = body || {};
    if (!account || !password) {
      return res.status(400).json({ message: "参数不完整", success: false });
    }
    try {
      const userResult = await pool.query(
        "SELECT id, email, username, password_hash FROM public.legacy_users WHERE email = $1 OR username = $1 LIMIT 1",
        [account]
      );
      if (userResult.rowCount === 0) {
        return res.status(400).json({ message: "账号不存在", success: false });
      }
      const user = userResult.rows[0];
      const hash = user.password_hash || "";
      let isValid = false;
      if (hash.startsWith("$2")) {
        isValid = await bcryptjs.compare(password, hash);
      } else {
        isValid = password === hash;
      }
      if (!isValid) {
        return res.status(400).json({ message: "账号或密码错误", success: false });
      }
      const token = signToken(
        {
          sub: user.id,
          email: user.email,
          name: user.username,
          displayName: user.username,
          avatar: "",
          isAdmin: false,
        },
        60 * 60 * 12
      );
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.username,
          displayName: user.username,
          avatar: "",
          isAdmin: false,
        },
      });
    } catch (error) {
      console.error("Login error", error);
      return res.status(500).json({ message: "登录失败", success: false });
    }
  }

  if (req.method === "GET" && path === "/sso-token") {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ message: "未登录" });
    }
    cleanupSsoTokens();
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = Date.now() + ssoTokenTtlSeconds * 1000;
    ssoTokenStore.set(token, {
      userId: authUser.sub,
      email: authUser.email,
      name: authUser.name,
      displayName: authUser.displayName,
      avatar: authUser.avatar,
      isAdmin: authUser.isAdmin,
      expiresAt,
    });
    res.setHeader(
      "Set-Cookie",
      `sso_token=${token}; Max-Age=${ssoTokenTtlSeconds}; Path=/; HttpOnly; Secure; SameSite=None`
    );
    return res.json({ token, email: authUser.email, expiresAt });
  }

  return res.status(404).json({ message: "Not found" });
}
