
import pool from "../db.js";

const run = async () => {
  try {
    const dbInfo = await pool.query(`
      SELECT current_database(), current_user, inet_server_addr(), version();
    `);
    console.log("DB Info:", dbInfo.rows[0]);

    try {
    const checkRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log("Users Table Schema:", checkRes.rows);
  } catch (e) {
    console.log("SELECT users schema failed:", e.message);
  }

    const tableType = await pool.query("SELECT table_type FROM information_schema.tables WHERE table_name = 'oauth_codes'");
    console.log("Table Type:", tableType.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
};

run();
