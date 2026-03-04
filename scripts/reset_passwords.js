import bcryptjs from "bcryptjs";
import pool from "../config/db.js";
import { randomUUID } from "crypto";

const updates = [
  { account: "10113773@qq.com", password: "ajW#%_H7fIMrwuG", identifiers: ["10113773@qq.com", "10113773"] },
  { account: "admin", password: "ajW#%_H7fIMrwuG", identifiers: ["admin", "admin@example.com"] },
  { account: "iasbt@outlook.com", password: "H9!rV2#kL7@tQ5mP", identifiers: ["iasbt@outlook.com", "i_asbt"] }
];

const run = async () => {
  try {
    let adminNotFound = false;
    let adminHash = null;
    for (const item of updates) {
      const hash = await bcryptjs.hash(item.password, 10);
      if (item.account === "admin") {
        adminHash = hash;
      }
      let usersUpdated = 0;
      let legacyUpdated = 0;
      for (const identifier of item.identifiers) {
        const usersRes = await pool.query(
          "UPDATE public.users SET password = $1 WHERE email = $2 OR name = $2",
          [hash, identifier]
        );
        const legacyRes = await pool.query(
          "UPDATE public.legacy_users SET password_hash = $1 WHERE email = $2 OR username = $2",
          [hash, identifier]
        );
        usersUpdated += usersRes.rowCount;
        legacyUpdated += legacyRes.rowCount;
      }
      const payload = { account: item.account, usersUpdated, legacyUpdated };
      if (usersUpdated + legacyUpdated === 0) {
        console.warn(JSON.stringify({ ...payload, warning: "account_not_found" }));
        if (item.account === "admin") {
          adminNotFound = true;
        }
      } else {
        console.log(JSON.stringify(payload));
      }
    }
    if (adminNotFound) {
      const adminUsers = await pool.query(
        "SELECT id, name, email FROM public.users WHERE is_admin = TRUE"
      );
      const adminLegacy = await pool.query(
        "SELECT id, username, email FROM public.legacy_users WHERE is_admin = TRUE"
      );
      if (adminHash) {
        const adminId = randomUUID();
        await pool.query(
          "INSERT INTO public.legacy_users (id, username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4, TRUE) ON CONFLICT (email) DO NOTHING",
          [adminId, "admin", "admin@example.com", adminHash]
        );
        await pool.query(
          "INSERT INTO public.users (id, name, email, password, is_admin) VALUES ($1, $2, $3, $4, TRUE) ON CONFLICT (email) DO NOTHING",
          [adminId, "admin", "admin@example.com", adminHash]
        );
        console.log(JSON.stringify({ adminUsers: adminUsers.rows, adminLegacy: adminLegacy.rows, adminCreated: true, adminId }));
      } else {
        console.log(JSON.stringify({ adminUsers: adminUsers.rows, adminLegacy: adminLegacy.rows, adminCreated: false }));
      }
    }
  } catch (err) {
    console.error("Password reset failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
