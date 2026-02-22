import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool
  .connect()
  .then((client) => {
    console.log("Database connected");
    client.release();
  })
  .catch((error) => {
    console.error("Database connection error", error);
  });

const ensureAdminIsolation = async () => {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.admin_accounts (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        security_level INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`
    );
    await pool.query("ALTER TABLE public.legacy_users DROP COLUMN IF EXISTS is_admin");
    const adminCandidate = await pool.query(
      "SELECT id, email, password_hash FROM public.legacy_users WHERE email = $1 LIMIT 1",
      ["iasbt@outlook.com"]
    );
    if (adminCandidate.rowCount === 0) return;

    const legacyAdmin = adminCandidate.rows[0];
    const exists = await pool.query(
      "SELECT id FROM public.admin_accounts WHERE email = $1 LIMIT 1",
      [legacyAdmin.email]
    );
    if (exists.rowCount > 0) return;

    const rawHash = legacyAdmin.password_hash || "";
    const passwordHash = rawHash.startsWith("$2")
      ? rawHash
      : await bcryptjs.hash(rawHash, 10);

    await pool.query(
      "INSERT INTO public.admin_accounts (id, email, password_hash, security_level, created_at) VALUES ($1, $2, $3, $4, NOW())",
      [legacyAdmin.id, legacyAdmin.email, passwordHash, 10]
    );
  } catch (error) {
    console.error("Admin isolation init error", error);
  }
};

if (process.env.SKIP_ADMIN_ISOLATION !== "1") {
  ensureAdminIsolation();
}

export default pool;
