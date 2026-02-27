
import pool from "../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  try {
    const sqlPath = path.join(__dirname, "migrations", "006_fix_oauth_redirect_uri.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    console.log("Running migration: 006_fix_oauth_redirect_uri.sql");
    await pool.query(sql);
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit();
  }
};

run();
