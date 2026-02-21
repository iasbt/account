import dotenv from "dotenv";
import { Pool } from "pg";
import { readFile } from "node:fs/promises";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function run() {
  try {
    const sql = await readFile(new URL("./init.sql", import.meta.url), "utf-8");
    await pool.query(sql);
    console.log("数据库初始化完成：已执行 init.sql");
  } catch (error) {
    console.log("读取 init.sql 失败，改用内置建表语句");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("数据库初始化完成：已创建 users 与 verification_codes");
  } finally {
    await pool.end();
  }

  process.exit(0);
}

run().catch((error) => {
  console.error("数据库初始化失败", error);
  process.exit(1);
});
