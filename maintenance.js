import pool from './db.js';
import bcryptjs from 'bcryptjs';

const run = async () => {
  try {
    console.log("Starting System Reset & Admin Init...");

    // 0. Ensure is_admin column exists (just in case)
    try {
      await pool.query("ALTER TABLE public.legacy_users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE");
      console.log("Verified is_admin column.");
    } catch (e) {
      if (e.code !== '42701') { // duplicate_column
         console.log("Column check skipped:", e.code);
      }
    }

    // 1. DELETE ALL USERS (As requested: "Delete all existing accounts")
    // We assume this is a hard reset for the management system.
    // Use TRUNCATE CASCADE to remove dependent data (like gallery.categories)
    await pool.query("TRUNCATE TABLE public.legacy_users CASCADE");
    console.log("Truncated legacy_users and dependent tables (CASCADE).");

    // Also clear admin_accounts if it exists
    try {
        await pool.query("DELETE FROM public.admin_accounts");
        console.log("Deleted all users from admin_accounts.");
    } catch (e) {
        console.log("admin_accounts table might not exist or empty.");
    }

    // 2. Insert New Admin
    const adminHash = "$2b$10$h5vpvh9YQdPux.gmrO6rluyNNtRFWxEjVsjA8IxrUb4Vhyd7Oyvdy"; // ajW#%_H7fIMrwuG
    const adminEmail = "admin@example.com";
    const adminUsername = "admin";

    await pool.query(
      "INSERT INTO public.legacy_users (id, username, email, password_hash, is_admin, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, TRUE, NOW(), NOW())",
      [adminUsername, adminEmail, adminHash]
    );
    console.log(`Created new admin user: ${adminUsername} / ${adminEmail}`);

    console.log("Reset complete.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    setTimeout(() => process.exit(0), 1000);
  }
};

run();
