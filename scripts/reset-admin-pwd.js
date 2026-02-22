import bcryptjs from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const [email, newPassword] = process.argv.slice(2);
if (!email || !newPassword) {
  console.log("用法: node scripts/reset-admin-pwd.js <email> <newPassword>");
  process.exit(1);
}

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const dbPath = path.resolve(projectRoot, "db.js");

const run = async () => {
  process.env.SKIP_ADMIN_ISOLATION = "1";
  const { default: pool } = await import(pathToFileURL(dbPath).href);
  await pool.query(
    `CREATE TABLE IF NOT EXISTS public.admin_accounts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      security_level INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`
  );
  const passwordHash = await bcryptjs.hash(newPassword, 10);
  let result = await pool.query(
    "UPDATE public.admin_accounts SET password_hash = $1 WHERE email = $2",
    [passwordHash, email]
  );
  if (result.rowCount === 0) {
    const adminId = crypto.randomUUID();
    result = await pool.query(
      "INSERT INTO public.admin_accounts (id, email, password_hash, security_level, created_at) VALUES ($1, $2, $3, $4, NOW())",
      [adminId, email, passwordHash, 10]
    );
  }
  await pool.end();

  try {
    fs.unlinkSync(scriptPath);
    console.log("密码已重置，脚本已自我销毁");
  } catch {
    console.log("密码已重置，请手动删除脚本文件");
  }
};

run().catch((error) => {
  console.error("重置失败", error);
  process.exit(1);
});
