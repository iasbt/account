
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log("DB Config:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  db: process.env.DB_NAME
});

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkUsers() {
  try {
    console.log("Connecting...");
    const client = await pool.connect();
    console.log("Connected.");
    
    const result = await client.query("SELECT id, username, email, password_hash, is_admin FROM public.legacy_users LIMIT 5");
    console.log("Users found:", result.rowCount);
    console.log("Sample data:", result.rows);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error("Error querying users:", err);
    process.exit(1);
  }
}

checkUsers();
