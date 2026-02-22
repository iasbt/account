import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("missing email or password");
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const run = async () => {
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "UPDATE public.legacy_users SET password_hash=$1, updated_at=NOW() WHERE email=$2",
    [hash, email]
  );
  const check = await pool.query(
    "SELECT id, email, LENGTH(password_hash) AS len FROM public.legacy_users WHERE email=$1",
    [email]
  );
  console.log({ updated: result.rowCount, user: check.rows[0] || null });
  await pool.end();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
