
import bcryptjs from "bcryptjs";
import pool from "../db.js";

export const ensureAdminIsolation = async () => {
  if (process.env.SKIP_ADMIN_ISOLATION === "1") {
    console.log("Skipping Admin Isolation check (SKIP_ADMIN_ISOLATION=1)");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Create table if not exists
    await client.query(
      `CREATE TABLE IF NOT EXISTS public.admin_accounts (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        security_level INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`
    );

    // 2. Check for legacy admin
    const adminCandidate = await client.query(
      "SELECT id, email, password_hash FROM public.legacy_users WHERE email = $1 LIMIT 1",
      ["iasbt@outlook.com"]
    );

    if (adminCandidate.rowCount > 0) {
      const legacyAdmin = adminCandidate.rows[0];
      
      // 3. Check if already exists in admin_accounts
      const exists = await client.query(
        "SELECT id FROM public.admin_accounts WHERE email = $1 LIMIT 1",
        [legacyAdmin.email]
      );

      if (exists.rowCount === 0) {
        const rawHash = legacyAdmin.password_hash || "";
        // Re-hash if not bcrypt (starts with $2)
        const passwordHash = rawHash.startsWith("$2")
          ? rawHash
          : await bcryptjs.hash(rawHash, 10);

        await client.query(
          "INSERT INTO public.admin_accounts (id, email, password_hash, security_level, created_at) VALUES ($1, $2, $3, $4, NOW())",
          [legacyAdmin.id, legacyAdmin.email, passwordHash, 10]
        );
        console.log("Admin account migrated successfully.");
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Admin isolation init error:", error);
    // Don't crash the server, but log the error
  } finally {
    client.release();
  }
};
