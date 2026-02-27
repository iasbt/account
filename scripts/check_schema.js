
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assuming .env is in the project root, one level up from scripts/
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables found:", res.rows.map(r => r.table_name));
    
    // Check refresh_tokens specifically
    const refreshTokenTable = res.rows.find(r => r.table_name === 'refresh_tokens');
    if (refreshTokenTable) {
        const colRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'refresh_tokens'
        `);
        console.log("refresh_tokens columns:", colRes.rows);
    } else {
        console.log("refresh_tokens table NOT found.");
    }
  } catch (err) {
    console.error("Error querying schema:", err);
  } finally {
    await pool.end();
  }
}

checkSchema();
