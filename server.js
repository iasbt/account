import dotenv from "dotenv";
import express from "express";
import bcryptjs from "bcryptjs";
import path from "node:path";
import pool from "./db.js";
import { sendCode } from "./emailService.js";

dotenv.config();

const app = express();
app.use(express.json());

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
    console.error("Send code error", error);
    return res.status(500).json({ message: "验证码发送失败", success: false });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
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
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (userResult.rowCount > 0) {
      return res.status(400).json({ message: "邮箱已注册", success: false });
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
        [email, passwordHash]
      );
      await client.query(
        "UPDATE verification_codes SET is_used = TRUE WHERE id = $1",
        [codeResult.rows[0].id]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Register transaction error", error);
      return res.status(500).json({ message: "注册失败", success: false });
    } finally {
      client.release();
    }

    return res.json({ message: "注册成功！", success: true });
  } catch (error) {
    console.error("Register error", error);
    return res.status(500).json({ message: "注册失败", success: false });
  }
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
