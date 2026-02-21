import dotenv from "dotenv";
import express from "express";
import bcryptjs from "bcryptjs";
import crypto from "node:crypto";
import path from "node:path";
import pool from "./db.js";
import { sendCode } from "./emailService.js";

dotenv.config();

const app = express();
app.use(express.json());
const parseOrigins = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const originAllowlist = parseOrigins(
  process.env.CORS_ALLOWLIST || process.env.CORS_ORIGIN || ""
);

const defaultAllowlist = [
  "https://account.iasbt.com",
  "*.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://account.iasbt.com/login",
];

const effectiveAllowlist =
  originAllowlist.length > 0 ? originAllowlist : defaultAllowlist;

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  try {
    const { host, protocol } = new URL(origin);
    return effectiveAllowlist.some((allowed) => {
      if (!allowed) return false;
      if (allowed.includes("*")) {
        const escaped = allowed.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`^${escaped.replace(/\\\*/g, ".*")}$`);
        if (allowed.includes("://")) {
          return regex.test(origin);
        }
        return regex.test(host);
      }
      return origin === allowed || `${protocol}//${host}` === allowed || host === allowed;
    });
  } catch {
    return false;
  }
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !isOriginAllowed(origin)) {
    if (req.method === "OPTIONS") {
      return res.sendStatus(403);
    }
    return res.status(403).json({ message: "Origin not allowed" });
  }
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

const ssoSecret = process.env.SSO_JWT_SECRET || "";
const ssoTokenTtlSeconds = Number(process.env.SSO_TOKEN_TTL || 300);
const ssoTokenStore = new Map();
const logLevel = process.env.LOG_LEVEL || "info";
const redactHeaders = (headers) => {
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "authorization") {
      result[key] = "[redacted]";
      continue;
    }
    result[key] = value;
  }
  return result;
};

app.use((req, res, next) => {
  if (!req.path.startsWith("/api/")) return next();
  const requestId = crypto.randomUUID();
  const start = Date.now();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  const origin = req.headers.origin || "";
  const entry = {
    requestId,
    method: req.method,
    path: req.path,
    origin,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  };
  if (logLevel === "debug") {
    entry.headers = redactHeaders(req.headers);
  }
  console.log(JSON.stringify({ level: "info", event: "api_request_start", ...entry }));
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      JSON.stringify({
        level: "info",
        event: "api_request_end",
        requestId,
        status: res.statusCode,
        durationMs,
      })
    );
  });
  next();
});

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

const parseAllowlist = () => {
  const raw = process.env.SSO_REDIRECT_ALLOWLIST || "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const isHostAllowed = (host, allowlist) => {
  if (allowlist.length > 0) {
    return allowlist.some((item) => host === item || host.endsWith(`.${item}`));
  }
  if (host === "iasbt.com" || host.endsWith(".iasbt.com")) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
};

app.post("/api/auth/send-code", async (req, res) => {
  const { email } = req.body;

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
    console.error("Send code error", { requestId: req.requestId, error });
    return res.status(500).json({ message: "验证码发送失败", success: false });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, code, password, name } = req.body;

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
      await client.query(
        "UPDATE verification_codes SET is_used = TRUE WHERE id = $1",
        [codeResult.rows[0].id]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Register transaction error", { requestId: req.requestId, error });
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
    console.error("Register error", { requestId: req.requestId, error });
    return res.status(500).json({ message: "注册失败", success: false });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { account, password } = req.body;

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
    console.error("Login error", { requestId: req.requestId, error });
    return res.status(500).json({ message: "登录失败", success: false });
  }
});

app.get("/api/sso/issue", async (req, res) => {
  const target = String(req.query.target || "");
  if (!target) {
    return res.status(400).json({ message: "目标地址不能为空" });
  }
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ message: "未登录" });
  }
  let url;
  try {
    url = new URL(target);
  } catch {
    return res.status(400).json({ message: "目标地址不合法" });
  }
  const allowlist = parseAllowlist();
  if (!isHostAllowed(url.hostname, allowlist)) {
    return res.status(403).json({ message: "目标域名不允许" });
  }
  const token = signToken(
    {
      sub: authUser.sub,
      email: authUser.email,
      name: authUser.name,
      displayName: authUser.displayName,
      avatar: authUser.avatar,
      isAdmin: authUser.isAdmin,
      aud: url.hostname,
    },
    60 * 5
  );
  if (!token) {
    return res.status(500).json({ message: "SSO 未配置" });
  }
  url.searchParams.set("sso_token", token);
  return res.json({ url: url.toString() });
});

app.get("/api/auth/sso-token", async (req, res) => {
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
  res.cookie("sso_token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: ssoTokenTtlSeconds * 1000,
  });
  return res.json({ token, email: authUser.email, expiresAt });
});

app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const imageCountResult = await pool.query(
      "SELECT COUNT(*)::bigint AS count FROM gallery.images"
    );
    const latestImagesResult = await pool.query(
      `SELECT title, file_path
       FROM gallery.images
       ORDER BY created_at DESC NULLS LAST
       LIMIT 5`
    );
    const userResult = await pool.query(
      "SELECT id, email, username FROM public.legacy_users WHERE email = $1 LIMIT 1",
      ["iasbt@outlook.com"]
    );

    return res.json({
      totalImages: imageCountResult.rows[0]?.count ?? "0",
      latestImages: latestImagesResult.rows,
      user: userResult.rows[0] || null,
    });
  } catch (error) {
    console.error("Dashboard stats error", error);
    return res.status(500).json({ message: "查询失败" });
  }
});

app.get("/dashboard.html", (req, res) => {
  const filePath = path.resolve(process.cwd(), "dashboard.html");
  res.sendFile(filePath);
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
