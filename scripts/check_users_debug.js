
import pool from '../db.js';

async function checkUsers() {
  try {
    const result = await pool.query("SELECT id, username, email, password_hash, is_admin FROM public.legacy_users LIMIT 5");
    console.log("Users found:", result.rowCount);
    console.log("Sample data:", result.rows);
    process.exit(0);
  } catch (err) {
    console.error("Error querying users:", err);
    process.exit(1);
  }
}

checkUsers();
