import pool from './db.js';
import bcryptjs from 'bcryptjs';

const run = async () => {
  try {
    console.log("Starting maintenance...");

    // 0. Ensure is_admin column exists
    try {
      await pool.query("ALTER TABLE public.legacy_users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE");
      console.log("Added is_admin column.");
    } catch (e) {
      // Ignore if exists
      // code 42701 = duplicate_column
      if (e.code !== '42701') {
         console.log("is_admin column likely exists or other error:", e.code);
      }
    }

    // 1. Deduplicate Usernames
    // Use raw query to bypass any ORM logic
    const allUsers = await pool.query("SELECT id, username FROM public.legacy_users ORDER BY created_at ASC");
    const seen = new Set();
    const updates = [];

    for (const user of allUsers.rows) {
      let username = user.username;
      if (!username) continue;

      if (seen.has(username)) {
        // Duplicate found!
        const suffix = Math.random().toString(36).substring(2, 7);
        const newUsername = `${username}_${suffix}`;
        // Execute immediately to be safe or push to promise array
        updates.push(pool.query("UPDATE public.legacy_users SET username = $1 WHERE id = $2", [newUsername, user.id]));
        console.log(`Renaming duplicate: ${username} -> ${newUsername} (ID: ${user.id})`);
      } else {
        seen.add(username);
      }
    }

    if (updates.length > 0) {
        await Promise.all(updates);
    }
    console.log(`Fixed ${updates.length} duplicate usernames.`);

    // 2. Upsert Admin
    const adminHash = "$2b$10$Gdnlg98N8nalacy/4/5CCO6gMFwey89GcdZzBBQLDledLhNGzxf52"; // RRxIKzt8+L4LrVv
    const adminEmail = "admin@example.com";
    const adminUsername = "admin";

    // Check if admin email exists
    const emailCheck = await pool.query("SELECT id FROM public.legacy_users WHERE email = $1", [adminEmail]);
    
    if (emailCheck.rowCount > 0) {
      // Update existing admin email user
      await pool.query(
        "UPDATE public.legacy_users SET username = $1, password_hash = $2, is_admin = TRUE, updated_at = NOW() WHERE email = $3",
        [adminUsername, adminHash, adminEmail]
      );
      console.log("Updated existing admin user (by email).");
    } else {
      // Check if admin username exists (but different email)
      const usernameCheck = await pool.query("SELECT id FROM public.legacy_users WHERE username = $1", [adminUsername]);
      if (usernameCheck.rowCount > 0) {
         // Conflict! An existing user has username 'admin' but different email.
         // We overwrite it to be the admin account.
         await pool.query(
           "UPDATE public.legacy_users SET email = $1, password_hash = $2, is_admin = TRUE, updated_at = NOW() WHERE username = $3",
           [adminEmail, adminHash, adminUsername]
         );
         console.log("Updated existing admin user (by username).");
      } else {
        // Create new
        await pool.query(
          "INSERT INTO public.legacy_users (username, email, password_hash, is_admin, created_at, updated_at) VALUES ($1, $2, $3, TRUE, NOW(), NOW())",
          [adminUsername, adminEmail, adminHash]
        );
        console.log("Created new admin user.");
      }
    }

    console.log("Maintenance complete.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    // Explicitly exit process after a short delay to ensure logs are flushed
    setTimeout(() => process.exit(0), 1000);
  }
};

run();
