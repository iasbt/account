import pool from "../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runMigration = async () => {
  const client = await pool.connect();
  try {
    console.log("Running migration: 005_update_redirect_uris.sql...");
    
    const sqlPath = path.join(__dirname, "migrations", "005_update_redirect_uris.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    
    console.log("Migration completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    client.release();
    process.exit();
  }
};

runMigration();